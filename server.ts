import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { PDFParse } from 'pdf-parse';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Extract contract information using Groq
app.post('/api/extract-contract', async (req, res) => {
  try {
    const { text, imageBase64, mimeType, fileName } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'Veuillez fournir du texte ou un fichier de contrat.' });
    }

    const systemPrompt = `Tu es un juriste d'entreprise expert en droit des contrats commerciaux et droit des affaires français (Code de commerce, Code civil, Loi Châtel, Loi Hamon).
Analyse le document ou le texte de contrat fournisseur fourni et extrais rigoureusement les informations clés au format JSON structuré strict.
Ne montre aucun raisonnement ou réflexion. Réponds directement et uniquement avec l'objet JSON, sans aucun texte avant ou après.

Règles d'extraction :
1. Catégorie : Choisis parmi : "telecom", "assurance", "saas", "energie", "maintenance", "autre".
2. Fréquence de paiement : Choisis parmi : "mensuel", "trimestriel", "annuel", "ponctuel", "autre".
3. Montant : extrait la valeur numérique (HT si disponible, sinon TTC) et la devise (souvent EUR).
4. Dates : Format standard YYYY-MM-DD. Si une date n'est pas explicite, estime une date réaliste ou laisse vide.
5. Préavis de résiliation : Nombre de jours (ex: 30, 60, 90). Si exprimé en mois (ex: 1 mois = 30, 2 mois = 60, 3 mois = 90).
6. Reconduction tacite : boolean true/false.
7. Contact de résiliation : Service résiliation, adresse postale complète pour envoi en Lettre Recommandée avec AR (LRAR), email ou téléphone si spécifié.
8. Clauses clés : 2 à 4 points majeurs (conditions de résiliation, reconduction, pénalités, indexation, etc.).
9. Statut suggéré : "active", "watch" (si échéance proche ou à surveiller), ou "cancel_pending".

Tu DOIS impérativement répondre uniquement avec un objet JSON respectant le schéma suivant :
{
  "vendorName": "Nom du fournisseur ou prestataire",
  "category": "telecom | assurance | saas | energie | maintenance | autre",
  "contractNumber": "Numéro ou référence du contrat",
  "amount": 0.0,
  "currency": "EUR",
  "paymentFrequency": "mensuel | trimestriel | annuel | ponctuel | autre",
  "signatureDate": "YYYY-MM-DD",
  "startDate": "YYYY-MM-DD",
  "commitmentDurationMonths": 12,
  "endDate": "YYYY-MM-DD",
  "noticePeriodDays": 30,
  "tacitRenewal": true,
  "cancellationContact": {
    "recipientName": "Nom du service",
    "address": "Adresse postale complète",
    "email": "Email de contact",
    "phone": "Numéro de téléphone"
  },
  "keyClauses": ["clause 1", "clause 2"],
  "summary": "Synthèse du contrat en 2 phrases",
  "suggestedStatus": "active | watch | cancel_pending"
}`;

    const isPdf =
      mimeType === 'application/pdf' ||
      (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
      (imageBase64 && imageBase64.startsWith('data:application/pdf'));

    let extractedText = text || '';

    // If a PDF is uploaded, extract its text using pdf-parse
    if (imageBase64 && isPdf) {
      try {
        const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const parser = new PDFParse({ data: pdfBuffer });
        const pdfData = await parser.getText();
        await parser.destroy().catch(() => {});
        const parsedText = pdfData.text ? pdfData.text.trim() : '';

        if (!parsedText) {
          return res.status(400).json({
            error:
              "Le document PDF ne contient pas de texte extractible (PDF scanné ou sous forme d'image). Veuillez copier-coller directement le texte du contrat dans l'onglet 'Coller le texte' ou importer une image (JPG/PNG).",
          });
        }
        extractedText = parsedText;
      } catch (pdfError: any) {
        console.error('Error parsing PDF:', pdfError);
        return res.status(400).json({
          error:
            "Échec de la lecture du fichier PDF. Si le document est scanné ou verrouillé, veuillez utiliser le champ 'Coller le texte' pour soumettre le contenu du contrat.",
        });
      }
    }

    const promptText = extractedText
      ? `Nom du fichier : ${fileName || 'contrat.pdf'}\nContenu du document à analyser :\n${extractedText}`
      : `Nom du fichier : ${fileName || 'contrat.pdf'}\nAnalyse ce document contractuel fournisseur et extrais toutes les clauses requises.`;

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [
      { type: 'text', text: promptText },
    ];

    // Only attach image_url if it is an actual image (not a PDF)
    if (imageBase64 && !isPdf) {
      const mime = mimeType || 'image/jpeg';
      const formattedUrl = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:${mime};base64,${imageBase64}`;
      userContent.push({
        type: 'image_url',
        image_url: {
          url: formattedUrl,
        },
      });
    }

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.6-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent as any },
      ],
      response_format: { type: 'json_object' },
      reasoning_effort: 'none' as any,
    });

    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error("Aucune réponse n'a été générée par le modèle.");
    }

    const parsedData = JSON.parse(resultText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error extracting contract:', error);
    res.status(500).json({
      error: error.message || "Erreur lors de l'analyse du contrat par l'IA",
    });
  }
});

// Generate formal French termination letter
app.post('/api/generate-letter', async (req, res) => {
  try {
    const { contract, companyProfile, reason, customNotes } = req.body;

    if (!contract || !contract.vendorName) {
      return res.status(400).json({ error: 'Données du contrat incomplètes.' });
    }

    const systemPrompt = `Tu es un juriste spécialisé en droit des contrats français des affaires et droit des obligations.
Rédige une lettre formelle de résiliation de contrat fournisseur, irréprochable sur le plan juridique en droit français (mention LRAR - Lettre Recommandée avec Accusé de Réception, visas des textes applicables comme la loi Châtel / article L. 215-1 du code de la consommation si professionnel assimilé, ou respect du préavis contractuel selon le Code Civil / Code de Commerce).

Règles de rédaction :
- Format officiel d'une lettre commerciale / juridique française :
  * Bloc expéditeur (entreprise cliente) en haut à gauche
  * Bloc destinataire (fournisseur / service résiliation) en haut à droite
  * Lieu et date du jour
  * Mention d'envoi : "LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION"
  * Objet clair avec mention du contrat et de la référence
  * Formule de politesse formelle (Madame, Monsieur,)
  * Corps structuré :
    1. Notification claire et sans équivoque de la volonté de résilier le contrat.
    2. Rappel des références du contrat, de la date de souscription et de l'échéance.
    3. Respect du délai de préavis légal/contractuel (${contract.noticePeriodDays || 30} jours).
    4. Demande formelle de confirmation écrite de la prise en compte de la résiliation et de la date effective de clôture.
    5. Mention relative à l'arrêt des prélèvements automatiques / facturations à compter de l'échéance.
  * Formule de politesse finale distinguée.
  * Signature du représentant légal.
- Rédige en français soigné, clair, ferme et courtois.`;

    const userPrompt = `Détails du contrat :
- Fournisseur : ${contract.vendorName}
- Numéro de contrat : ${contract.contractNumber || 'Non spécifié'}
- Catégorie : ${contract.category}
- Date d'échéance : ${contract.endDate}
- Préavis requis : ${contract.noticePeriodDays} jours
- Reconduction tacite : ${contract.tacitRenewal ? 'Oui' : 'Non'}
- Contact / Adresse résiliation : ${JSON.stringify(contract.cancellationContact || {})}

Détails de l'entreprise cliente expéditrice :
- Raison sociale : ${companyProfile?.companyName || 'Mon Entreprise SAS'}
- SIRET : ${companyProfile?.siret || '123 456 789 00012'}
- Adresse : ${companyProfile?.address || '10 rue de la Paix, 75002 Paris'}
- Représentant : ${companyProfile?.signatoryName || 'La Direction'} (${companyProfile?.signatoryTitle || 'Gérant'})
- Email : ${companyProfile?.email || 'direction@entreprise.fr'}
- Téléphone : ${companyProfile?.phone || '01 23 45 67 89'}

Motif spécifique / Contexte : ${reason || "Résiliation à l'échéance contractuelle avec respect du délai de préavis."}
Notes supplémentaires : ${customNotes || 'Aucune'}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const letterContent = completion.choices[0]?.message?.content || '';
    res.json({
      success: true,
      letter: letterContent,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating letter:', error);
    res.status(500).json({
      error: error.message || "Erreur lors de la génération de la lettre",
    });
  }
});

// Export Express app for Vercel serverless functions
export { app };

// Vite middleware & start server (for local dev and standard container hosting)
export async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`B2B Contract Manager running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server if not running inside a serverless platform like Vercel
if (!process.env.VERCEL) {
  startServer();
}

