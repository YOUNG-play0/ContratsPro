import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const app = express();

app.use(express.json({ limit: '25mb' }));

// Lazy/Safe Groq client initialization
function getGroqClient(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
}

// API Router
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Extract contract information using Groq
apiRouter.post('/extract-contract', async (req, res) => {
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
5. Tacite reconduction : Indique précisément si le contrat se renouvelle automatiquement (true/false) et les conditions.
6. Préavis de résiliation : Nombre de jours ou mois requis avant l'échéance pour notifier la résiliation (ex: 30 jours, 3 mois).
7. Modalités de résiliation : Extrais l'adresse postale, l'email ou le portail requis pour envoyer le préavis (ex: LRAR obligatoire).
8. Clauses spécifiques : Signale tout engagement pluriannuel, frais de résiliation anticipée, pénalités, ou clause abusive/à risque.
9. Statut suggéré : "active" (en cours), "watch" (attention échéance proche ou clause sensible), ou "cancel_pending" (résiliation à engager).

Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "vendor": "Nom du fournisseur",
  "category": "telecom | assurance | saas | energie | maintenance | autre",
  "amount": 0,
  "currency": "EUR",
  "billingFrequency": "mensuel | trimestriel | annuel | ponctuel | autre",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "noticeDays": 30,
  "noticePeriodDescription": "ex: 30 jours avant la date anniversaire par lettre recommandée avec AR",
  "terminationAddress": "Adresse ou service résiliation si mentionné",
  "tacitRenewal": true,
  "keyClauses": ["Clause 1...", "Clause 2..."],
  "riskLevel": "low | medium | high",
  "riskAnalysis": "Courte analyse juridique des risques et points de vigilance pour l'acheteur/entreprise.",
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
      { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
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
        image_url: { url: formattedUrl },
      });
    }

    const groq = getGroqClient();
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
      throw new Error('Réponse vide du modèle Groq');
    }

    const parsedJson = JSON.parse(resultText);
    res.json(parsedJson);
  } catch (error: any) {
    console.error('Error extracting contract:', error);
    res.status(500).json({
      error: error.message || "Erreur lors de l'analyse IA du contrat",
    });
  }
});

// Generate formal legal termination / renegotiation letter
apiRouter.post('/generate-letter', async (req, res) => {
  try {
    const { contract, companyName, letterType, customReason, senderInfo } = req.body;

    if (!contract || !contract.vendor) {
      return res.status(400).json({ error: 'Données du contrat incomplètes.' });
    }

    const systemPrompt = `Tu es un avocat d'affaires expert en contentieux et négociation contractuelle B2B en France.
Tu rédiges des courriers juridiques d'une rigueur absolue, conformes aux usages commerciaux français et au droit positif (Code de commerce, Code civil, clauses de résiliation, préavis contractuel).
Tes courriers doivent être clairs, fermes, professionnels, avec mentions d'envoi en Recommandé avec Accusé de Réception (LRAR), références légales pertinentes, et respect du préavis.`;

    const typeDescriptions: Record<string, string> = {
      termination: 'Lettre de résiliation de contrat à échéance (non-reconduction tacite ou fin de période d’engagement)',
      anticipatory_breach: 'Mise en demeure et résiliation pour inexécution contractuelle / manquements graves du prestataire',
      renegotiation: 'Demande officielle de renégociation tarifaire et des conditions contractuelles avant reconduction',
      chatel_reminder: 'Demande de résiliation au titre du non-respect de l’obligation d’information préalable (Loi Châtel / Art L215-1 Code Conso si applicable)',
    };

    const requestedType = typeDescriptions[letterType] || 'Lettre de résiliation de contrat';

    const userPrompt = `Rédige un courrier officiel et juridique pour :
Objet : ${requestedType}
Fournisseur destinataire : ${contract.vendor}
Adresse de résiliation (si connue) : ${contract.terminationAddress || '[Adresse du fournisseur / Service Résiliation]'}
Nom de l'entreprise émettrice : ${companyName || '[Nom de votre entreprise]'}
Coordonnées émetteur : ${senderInfo?.name || '[Nom du signataire]'}, ${senderInfo?.title || 'Directeur Général / Responsable des Achats'}, ${senderInfo?.address || '[Adresse de votre entreprise]'}
Numéro de contrat / Référence : ${contract.id || '[Référence du contrat]'}
Montant annuel / mensuel : ${contract.amount} ${contract.currency} (${contract.billingFrequency})
Date d'échéance : ${contract.endDate || '[Date de fin]'}
Préavis contractuel : ${contract.noticePeriodDescription || `${contract.noticeDays} jours`}
Motif spécifique ou complémentaire : ${customReason || 'Résiliation selon les termes convenus au contrat.'}

Le courrier doit être entièrement rédigé et prêt à être envoyé (avec en-tête, objet, corps du texte formel, formules de politesse juridiques, et mentions légales appropriées).`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const letterContent = completion.choices[0]?.message?.content;
    if (!letterContent) {
      throw new Error('Impossible de générer la lettre');
    }

    res.json({
      letter: letterContent,
      suggestedSubject: `${requestedType} - Contrat ${contract.vendor} (Réf: ${contract.id || 'N/A'})`,
    });
  } catch (error: any) {
    console.error('Error generating letter:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de la génération du courrier juridique',
    });
  }
});

// Mount router on both '/api' and '/' for maximum Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

export { app };
export default app;
