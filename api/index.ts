import express from 'express';
import fs from 'fs';
import path from 'path';
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

// EU Member States (27 countries, France is Level 1)
const EU_COUNTRY_CODES_SET = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

function determineLegalConfidence(countryCode?: string) {
  const code = (countryCode || 'FR').toUpperCase().trim();
  if (code === 'FR' || code === 'FRANCE') {
    return {
      level: 1 as const,
      country: 'FR',
      note: 'Lettre générée avec références légales françaises',
      disclaimer: 'Conforme aux articles 1103 & 1211 du Code civil français, Loi Châtel et formalisme d’envoi LRAR.',
    };
  }
  if (EU_COUNTRY_CODES_SET.has(code)) {
    return {
      level: 2 as const,
      country: code,
      note: 'Lettre générée avec prudence juridique (UE) — vérification recommandée',
      disclaimer: 'Prudence juridique UE : formulation contractuelle et principes généraux du marché unique, sans citation d’articles nationaux spécifiques. Relecture recommandée.',
    };
  }
  return {
    level: 3 as const,
    country: code || 'GLOBAL',
    note: 'Lettre générique — vérification par un professionnel local fortement recommandée',
    disclaimer: 'Lettre contractuelle internationale sans référence légale : vérification par un professionnel juridique local fortement recommandée.',
  };
}

// Generate formal legal termination / renegotiation letter
apiRouter.post('/generate-letter', async (req, res) => {
  try {
    const { contract, companyName, companyProfile, letterType, reason, customReason, customNotes, senderInfo } = req.body;

    const vendorName = contract?.vendorName || contract?.vendor;
    if (!contract || !vendorName) {
      return res.status(400).json({ success: false, error: 'Données du contrat incomplètes.' });
    }

    // Determine country & legal confidence tier (1 = France, 2 = EU, 3 = Rest of the world)
    const clientCountry = (companyProfile?.country || req.body.country || 'FR').toUpperCase().trim();
    const confidence = determineLegalConfidence(clientCountry);

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
    const finalAddress = senderInfo?.address || (companyProfile ? `${companyProfile.address}, ${companyProfile.postalCode} ${companyProfile.city}, ${companyProfile.country || 'France'}` : '[Adresse de votre entreprise]');
    const terminationAddr = contract.cancellationContact?.address || contract.terminationAddress || '[Adresse du fournisseur / Service Résiliation]';
    const contractNum = contract.contractNumber || contract.id || 'N/A';
    const noticeDesc = contract.noticePeriodDays ? `${contract.noticePeriodDays} jours` : (contract.noticePeriodDescription || '30 jours');
    const noteReason = reason || customReason || customNotes || 'Résiliation selon les termes convenus au contrat.';

    let systemPrompt = '';
    let userPrompt = '';

    if (confidence.level === 1) {
      // NIVEAU 1 : France (Droit positif, articles 1103/1211 Code civil, Loi Châtel, mention LRAR, français)
      systemPrompt = `Tu es un avocat d'affaires expert en contentieux et négociation contractuelle B2B en France (Niveau de confiance juridique 1 : Droit positif français).
Tu rédiges des courriers juridiques d'une rigueur absolue, conformes aux usages commerciaux français et au droit positif français (Code civil articles 1103 et 1211, Code de commerce, clauses de résiliation, respect scrupuleux du préavis contractuel, et Loi Châtel / Art L. 215-1 du Code de la consommation pour les professionnels assimilés le cas échéant).
Tes courriers sont intégralement rédigés en français, clairs, fermes, professionnels, avec mentions d'envoi en Lettre Recommandée avec Accusé de Réception (LRAR), références légales précises et applicables, ordre formel de cessation des prélèvements et prestations, et demande de confirmation écrite.`;

      userPrompt = `Rédige un courrier officiel et juridique pour :
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

Le courrier doit être entièrement rédigé et prêt à être envoyé (avec en-tête complet, objet formel avec mention LRAR, corps du texte juridique rigoureux avec références aux articles 1103 et 1211 du Code civil, formules de politesse juridiques, et bloc de signature).`;
    } else if (confidence.level === 2) {
      // NIVEAU 2 : Union Européenne (27 pays UE)
      systemPrompt = `You are a senior European commercial lawyer specialized in cross-border B2B contract termination within the European Union (Legal Confidence Level 2: European Union Member State: ${confidence.country}).
CRITICAL DIRECTIVES FOR LEVEL 2:
1. Tone: Formal, firm, assertive, and professional commercial letter.
2. Contractual notice: Explicitly emphasize compliance with the agreed contractual notice period (${noticeDesc}) and stated end date.
3. STRICT STATUTORY PRUDENCE (NO SPECIFIC ARTICLE CITATIONS): DO NOT cite specific national law articles, national civil code clauses, or specific local transposition articles, because legal transposition and statutory nuances differ across EU member states.
4. Standard European phrasing: Use established EU-wide commercial phrasing such as "in accordance with the applicable notice period under our agreement and relevant European Union consumer and commercial protection principles".
5. Structure: Complete formal business letter ready to send, including header, sender/recipient addresses, registered delivery notice ("REGISTERED MAIL / LETTRE RECOMMANDÉE"), clear demand to terminate recurring services and cease all direct debits upon the expiration date, and request for written acknowledgment.
6. Language: If the user inputs French or if the destination/client is francophone (BE, LU, etc.), you may draft in French or English with standard formal phrasing. Otherwise draft in formal British/International English.`;

      userPrompt = `Draft a formal European contract termination notice for:
Subject / Purpose: ${requestedType}
Recipient Vendor: ${vendorName}
Vendor Termination Address: ${terminationAddr}
Client Company: ${finalCompanyName} (Country: ${confidence.country})
Signatory: ${finalSignatoryName}, ${finalSignatoryTitle}
Client Address: ${finalAddress}
Contract Reference / ID: ${contractNum}
Financial Terms: ${contract.amount || 'N/A'} ${contract.currency || 'EUR'} (${contract.paymentFrequency || 'monthly'})
Contract Expiration Date: ${contract.endDate || '[Effective Date]'}
Agreed Notice Period: ${noticeDesc}
Specific Reason / Notes: ${noteReason}

Remember: Strict Level 2 legal prudence — do not quote specific national law articles or codes. Use general phrasing such as "in accordance with the applicable notice period under our contract and relevant EU consumer/commercial protection principles".`;
    } else {
      // NIVEAU 3 : Reste du monde / International
      systemPrompt = `You are an international business contracts specialist (Legal Confidence Level 3: International & Non-EU Jurisdictions).
CRITICAL DIRECTIVES FOR LEVEL 3:
1. Language: Draft the formal contract termination notice in English.
2. Tone: Formal, clear, firm, and commercially neutral.
3. ZERO STATUTORY/LEGAL CITATIONS: Absolutely DO NOT cite any national law, statutory code, civil code article, or specific government regulation of any kind.
4. Purely contractual foundation: The termination MUST rely strictly and solely on the terms of the agreement itself, using phrasing such as "in accordance with the terms and notice requirements set out in our agreement".
5. Demand: State the exact effective termination date, demand immediate cessation of recurring billing and automatic payment processing, and request written confirmation of account closure.
6. Footer Legal Warning: At the very end of the document below the signature, include a distinct note: "[Notice: This document is formulated on a purely contractual basis. Due to varying local jurisdictional requirements, formal review by a qualified legal professional in your country is strongly recommended before final dispatch.]"`;

      userPrompt = `Draft a formal international contract termination letter for:
Subject: ${requestedType}
Vendor: ${vendorName}
Vendor Address: ${terminationAddr}
Client Company: ${finalCompanyName} (Country: ${confidence.country})
Signatory: ${finalSignatoryName}, ${finalSignatoryTitle}
Client Address: ${finalAddress}
Contract Reference: ${contractNum}
Amount: ${contract.amount || 'N/A'} ${contract.currency || 'USD'} (${contract.paymentFrequency || 'monthly'})
End Date: ${contract.endDate || '[Effective Date]'}
Notice Period: ${noticeDesc}
Reason: ${noteReason}

Remember: Zero statutory legal references. Ground all clauses purely on contractual terms.`;
    }

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
      suggestedSubject: `${requestedType} - ${vendorName} (Ref: ${contractNum})`,
      legalConfidenceLevel: confidence.level,
      legalConfidenceNote: confidence.note,
      legalConfidenceDisclaimer: confidence.disclaimer,
      country: confidence.country,
    });
  } catch (error: any) {
    console.error('Error generating letter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération du courrier juridique',
    });
  }
});

// Early user waitlist data helpers
interface WaitlistEntry {
  email: string;
  companyName?: string;
  contractsCount?: string | number;
  createdAt: string;
  updatedAt?: string;
  userAgent?: string;
  ip?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

let inMemoryWaitlist: WaitlistEntry[] = [];

function loadWaitlist(): WaitlistEntry[] {
  try {
    if (fs.existsSync(WAITLIST_FILE)) {
      const data = fs.readFileSync(WAITLIST_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        inMemoryWaitlist = list;
        return list;
      }
    }
  } catch (err) {
    console.warn('Could not read waitlist file, using memory cache:', err);
  }
  return inMemoryWaitlist;
}

function saveWaitlist(list: WaitlistEntry[]): void {
  inMemoryWaitlist = list;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to waitlist file, kept in memory cache:', err);
  }
}

// 1. Capture early access waitlist email
apiRouter.post('/waitlist', (req, res) => {
  try {
    const { email, companyName, contractsCount } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner une adresse email valide.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const waitlist = loadWaitlist();

    const existingIndex = waitlist.findIndex((e) => e.email.toLowerCase() === cleanEmail);
    const entry: WaitlistEntry = {
      email: cleanEmail,
      companyName: companyName ? String(companyName).trim() : '',
      contractsCount: contractsCount ?? '',
      createdAt: new Date().toISOString(),
      userAgent: (req.headers['user-agent'] as string) || '',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
    };

    if (existingIndex >= 0) {
      waitlist[existingIndex] = {
        ...waitlist[existingIndex],
        companyName: entry.companyName || waitlist[existingIndex].companyName,
        contractsCount: entry.contractsCount || waitlist[existingIndex].contractsCount,
        updatedAt: new Date().toISOString(),
      };
    } else {
      waitlist.push(entry);
    }

    saveWaitlist(waitlist);

    res.json({
      success: true,
      message: 'Merci ! Vous êtes inscrit(e) avec succès.',
      total: waitlist.length,
    });
  } catch (err: any) {
    console.error('Error saving waitlist entry:', err);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de l’inscription.',
    });
  }
});

// 4. Export all waitlist emails (protected with WAITLIST_ADMIN_KEY)
apiRouter.get('/waitlist/export', (req, res) => {
  const adminKey = process.env.WAITLIST_ADMIN_KEY || 'admin_secret_key';
  const providedKey = req.query.key || req.headers['x-admin-key'];

  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({
      success: false,
      error: 'Accès non autorisé. Clé admin manquante ou invalide (?key=admin_secret_key).',
    });
  }

  const waitlist = loadWaitlist();

  if (req.query.format === 'csv') {
    const header = 'Email,Entreprise,Nombre de contrats,Date inscription\n';
    const rows = waitlist
      .map(
        (e) =>
          `"${e.email}","${(e.companyName || '').replace(/"/g, '""')}","${e.contractsCount || ''}","${e.createdAt}"`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist_contratspro.csv"');
    return res.send(header + rows);
  }

  res.json({
    success: true,
    total: waitlist.length,
    exportedAt: new Date().toISOString(),
    waitlist,
  });
});

// Mount router on both '/api' and '/' for maximum Vercel rewrite compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Vercel serverless function configuration (extend timeout to 30s)
export const maxDuration = 30;

export { app };
export default app;
