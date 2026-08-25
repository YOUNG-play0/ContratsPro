import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { extractText, getDocumentProxy } from 'unpdf';

dotenv.config();

const app = express();

app.use(express.json({ limit: '25mb' }));

// Helper to extract text from PDF using unpdf (serverless-friendly)
async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n') : text || '';
}

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
      return res.status(400).json({ success: false, error: 'Veuillez fournir du texte ou un fichier de contrat.' });
    }

    const systemPrompt = `Tu es un juriste d'entreprise expert en droit des contrats commerciaux et droit des affaires français (Code de commerce, Code civil, Loi Châtel, Loi Hamon).
Analyse le document ou le texte de contrat fournisseur fourni et extrais rigoureusement les informations clés au format JSON structuré strict.
Ne montre aucun raisonnement ou réflexion. Réponds directement et uniquement avec l'objet JSON, sans aucun texte avant ou après.

Règles d'extraction :
1. vendorName : Nom exact de l'entreprise ou du prestataire fournisseur.
2. category : Choisis strictement parmi : "telecom", "assurance", "saas", "energie", "maintenance", "autre".
3. contractNumber : Numéro de référence ou de contrat si mentionné (ou chaîne vide).
4. amount : Valeur numérique du montant (HT si disponible, sinon TTC).
5. currency : Devise (ex: "EUR").
6. paymentFrequency : Choisis strictement parmi : "mensuel", "trimestriel", "annuel", "ponctuel", "autre".
7. signatureDate : Date de signature au format YYYY-MM-DD (ou chaîne vide si inconnue).
8. startDate : Date d'effet ou de début au format YYYY-MM-DD.
9. commitmentDurationMonths : Durée de la période d'engagement initiale en nombre de mois (ex: 12, 24, 36, ou 0 si sans engagement).
10. endDate : Date d'échéance principale au format YYYY-MM-DD.
11. noticePeriodDays : Nombre de jours de préavis requis avant l'échéance pour notifier la résiliation (ex: 30, 60, 90).
12. tacitRenewal : true si le contrat se renouvelle par tacite reconduction, false sinon.
13. cancellationContact : Objet structuré avec les coordonnées de résiliation :
    - recipientName : Nom du service ou destinataire (ex: "Service Résiliation").
    - address : Adresse postale complète de résiliation si mentionnée (ou chaîne vide).
    - email : Email de résiliation ou contact (ou chaîne vide).
    - phone : Numéro de téléphone (ou chaîne vide).
14. keyClauses : Tableau de chaînes listant les clauses essentielles, pénalités, conditions de reconduction ou d'augmentation tarifaire.
15. summary : Synthèse claire et concise du contrat et de ses conditions clés.
16. suggestedStatus : Choisis strictement parmi : "active" (contrat en cours normal), "watch" (échéance proche ou clause sensible à surveiller), "cancel_pending" (à résilier).

Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "vendorName": "Nom du fournisseur",
  "category": "telecom | assurance | saas | energie | maintenance | autre",
  "contractNumber": "NUM-12345",
  "amount": 0,
  "currency": "EUR",
  "paymentFrequency": "mensuel | trimestriel | annuel | ponctuel | autre",
  "signatureDate": "YYYY-MM-DD",
  "startDate": "YYYY-MM-DD",
  "commitmentDurationMonths": 12,
  "endDate": "YYYY-MM-DD",
  "noticePeriodDays": 30,
  "tacitRenewal": true,
  "cancellationContact": {
    "recipientName": "Service Résiliation",
    "address": "123 rue Exemple, 75001 Paris",
    "email": "contact@fournisseur.com",
    "phone": "0102030405"
  },
  "keyClauses": ["Clause 1...", "Clause 2..."],
  "summary": "Résumé du contrat...",
  "suggestedStatus": "active | watch | cancel_pending"
}`;

    const isPdf =
      mimeType === 'application/pdf' ||
      (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
      (imageBase64 && imageBase64.startsWith('data:application/pdf'));

    let extractedText = text || '';

    // If a PDF is uploaded, extract its text using unpdf
    if (imageBase64 && isPdf) {
      try {
        const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const rawText = await extractPdfText(new Uint8Array(pdfBuffer));
        const parsedText = rawText ? rawText.trim() : '';

        if (!parsedText) {
          return res.status(400).json({
            success: false,
            error:
              "Le document PDF ne contient pas de texte extractible (PDF scanné ou sous forme d'image). Veuillez copier-coller directement le texte du contrat dans l'onglet 'Coller le texte' ou importer une image (JPG/PNG).",
          });
        }
        extractedText = parsedText;
      } catch (pdfError: any) {
        console.error('Error parsing PDF with unpdf:', pdfError);
        return res.status(400).json({
          success: false,
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
      max_tokens: 4096,
    });

    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error('Réponse vide du modèle Groq');
    }

    const parsedJson = JSON.parse(resultText);
    res.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error('Error extracting contract:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Erreur lors de l'analyse IA du contrat",
    });
  }
});

// Generate formal legal termination / renegotiation letter
apiRouter.post('/generate-letter', async (req, res) => {
  try {
    const { contract, companyName, companyProfile, letterType, reason, customReason, customNotes, senderInfo } = req.body;

    const vendorName = contract?.vendorName || contract?.vendor;
    if (!contract || !vendorName) {
      return res.status(400).json({ success: false, error: 'Données du contrat incomplètes.' });
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
    const finalCompanyName = companyName || companyProfile?.companyName || '[Nom de votre entreprise]';
    const finalSignatoryName = senderInfo?.name || companyProfile?.signatoryName || '[Nom du signataire]';
    const finalSignatoryTitle = senderInfo?.title || companyProfile?.signatoryTitle || 'Directeur Général / Responsable des Achats';
    const finalAddress = senderInfo?.address || (companyProfile ? `${companyProfile.address}, ${companyProfile.postalCode} ${companyProfile.city}` : '[Adresse de votre entreprise]');
    const terminationAddr = contract.cancellationContact?.address || contract.terminationAddress || '[Adresse du fournisseur / Service Résiliation]';
    const contractNum = contract.contractNumber || contract.id || 'N/A';
    const noticeDesc = contract.noticePeriodDays ? `${contract.noticePeriodDays} jours` : (contract.noticePeriodDescription || '30 jours');
    const noteReason = reason || customReason || customNotes || 'Résiliation selon les termes convenus au contrat.';

    const userPrompt = `Rédige un courrier officiel et juridique pour :
Objet : ${requestedType}
Fournisseur destinataire : ${vendorName}
Adresse de résiliation (si connue) : ${terminationAddr}
Nom de l'entreprise émettrice : ${finalCompanyName}
Coordonnées émetteur : ${finalSignatoryName}, ${finalSignatoryTitle}, ${finalAddress}
Numéro de contrat / Référence : ${contractNum}
Montant annuel / mensuel : ${contract.amount || 'N/C'} ${contract.currency || 'EUR'} (${contract.paymentFrequency || contract.billingFrequency || 'mensuel'})
Date d'échéance : ${contract.endDate || '[Date de fin]'}
Préavis contractuel : ${noticeDesc}
Motif spécifique ou complémentaire : ${noteReason}

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
      success: true,
      letter: letterContent,
      suggestedSubject: `${requestedType} - Contrat ${vendorName} (Réf: ${contractNum})`,
    });
  } catch (error: any) {
    console.error('Error generating letter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération du courrier juridique',
    });
  }
});

// Mount router on both '/api' and '/' for maximum Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Vercel serverless function configuration (extend timeout to 30s)
export const maxDuration = 30;

export { app };
export default app;
