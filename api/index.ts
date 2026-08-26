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

    const systemPrompt = `Tu es un juriste d'entreprise expert en droit des contrats commerciaux et droit des affaires (Code de commerce, Code civil, Loi Châtel, droit comparé).
Analyse le document ou le texte de contrat fournisseur fourni et extrais rigoureusement les informations clés au format JSON structuré strict.
Ne montre aucun raisonnement ou réflexion. Réponds directement et uniquement avec l'objet JSON, sans aucun texte avant ou après.

Règles d'extraction :
1. vendorName : Nom exact de l'entreprise ou du prestataire fournisseur.
2. category : Choisis strictement parmi : "telecom", "assurance", "saas", "energie", "maintenance", "autre".
3. contractNumber : Numéro de référence ou de contrat si mentionné (ou chaîne vide).
4. amount : Valeur numérique du montant (HT si disponible, sinon TTC).
5. currency : Devise (ex: "EUR", "USD", "GBP", "XOF").
6. paymentFrequency : Choisis strictement parmi : "mensuel", "trimestriel", "annuel", "ponctuel", "autre".
7. signatureDate : Date de signature au format YYYY-MM-DD (ou chaîne vide si inconnue).
8. startDate : Date d'effet ou de début du présent contrat au format YYYY-MM-DD.
9. relationshipStartDate : Date de début initiale de la relation commerciale avec ce fournisseur (si mentionnée ou antérieure à startDate, sinon identique à startDate ou chaîne vide).
10. commitmentDurationMonths : Durée de la période d'engagement initiale en nombre de mois (ex: 12, 24, 36, ou 0 si sans engagement).
11. endDate : Date d'échéance principale au format YYYY-MM-DD.
12. noticePeriodDays : Nombre de jours de préavis requis avant l'échéance pour notifier la résiliation (ex: 30, 60, 90).
13. tacitRenewal : true si le contrat se renouvelle par tacite reconduction, false sinon.
14. cancellationContact : Objet structuré avec les coordonnées de résiliation :
    - recipientName : Nom du service ou destinataire (ex: "Service Résiliation").
    - address : Adresse postale complète de résiliation si mentionnée (ou chaîne vide).
    - email : Email de résiliation ou contact (ou chaîne vide).
    - phone : Numéro de téléphone (ou chaîne vide).
15. keyClauses : Tableau de chaînes listant les clauses essentielles, pénalités, conditions de reconduction ou d'augmentation tarifaire.
16. summary : Synthèse claire et concise du contrat et de ses conditions clés.
17. suggestedStatus : Choisis strictement parmi : "active" (contrat en cours normal), "watch" (échéance proche ou clause sensible à surveiller), "cancel_pending" (à résilier).

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
  "relationshipStartDate": "YYYY-MM-DD",
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

// EU Member States (26 countries, France is Level 1)
const EU_COUNTRY_CODES_SET = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

// OHADA Member States (17 African countries)
const OHADA_COUNTRY_CODES_SET = new Set([
  'BJ', 'BF', 'CM', 'CF', 'KM', 'CG', 'CD', 'CI', 'GA', 'GN', 
  'GW', 'GQ', 'ML', 'NE', 'SN', 'TD', 'TG'
]);

// Calculate duration in months between a start date and today
function calculateRelationshipMonths(startDateStr?: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function determineLegalConfidence(countryCode?: string) {
  const code = (countryCode || 'FR').toUpperCase().trim();

  // NIVEAU 1 : France
  if (code === 'FR' || code === 'FRANCE') {
    return {
      level: 1 as const,
      country: 'FR',
      isUSA: false,
      isOHADA: false,
      note: 'Lettre générée avec références légales françaises précises (Code civil, Code de commerce, Loi Châtel, LRAR)',
      disclaimer: 'Conforme aux articles 1103 et 1211 du Code civil, Loi Châtel et formalisme LRAR. Intègre l’évaluation du risque de rupture brutale des relations commerciales (art. L. 442-1 C. com.).',
    };
  }

  // NIVEAU 2 : Union Européenne + États-Unis
  if (EU_COUNTRY_CODES_SET.has(code) || code === 'US' || code === 'USA') {
    const isUSA = code === 'US' || code === 'USA';
    return {
      level: 2 as const,
      country: isUSA ? 'US' : code,
      isUSA,
      isOHADA: false,
      note: isUSA
        ? 'Lettre générée avec respect strict du contrat US (Common Law / droit civil Louisiane)'
        : 'Lettre générée avec prudence juridique UE basée sur le respect du préavis contractuel',
      disclaimer: isUSA
        ? 'Formulation basée sur le strict respect du contrat écrit (Common Law pour 49 États / droit mixte pour la Louisiane), sans citation de lois externes non vérifiées.'
        : 'Prudence juridique UE : formulation contractuelle et respect scrupuleux du préavis convenu sans citation d’articles nationaux spécifiques. Relecture recommandée.',
    };
  }

  // NIVEAU 3 : UK, Canada & Espace OHADA
  if (code === 'GB' || code === 'UK' || code === 'CA' || OHADA_COUNTRY_CODES_SET.has(code)) {
    const isOHADA = OHADA_COUNTRY_CODES_SET.has(code);
    return {
      level: 3 as const,
      country: code,
      isUSA: false,
      isOHADA,
      note: isOHADA
        ? 'Lettre contractuelle adaptée à l’espace OHADA (Droit commercial unifié)'
        : 'Lettre formulée strictly under the contractual terms (aucune référence légale externe)',
      disclaimer: isOHADA
        ? 'Formulation contractuelle adaptée à l’espace OHADA, fondée sur les termes du contrat et les principes généraux de l’Acte uniforme OHADA sur le droit commercial général.'
        : 'Formulation purement contractuelle (« strictly under the contractual terms ») sans citation de textes législatifs externes.',
    };
  }

  // NIVEAU 4 : Reste du Monde / Autres pays
  return {
    level: 4 as const,
    country: code || 'GLOBAL',
    isUSA: false,
    isOHADA: false,
    note: 'Lettre minimaliste et factuelle — vérification par un professionnel local recommandée',
    disclaimer: 'Formulation minimaliste et purement factuelle rappelant les termes du contrat et la date d’effet souhaitée, sans aucune référence légale.',
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

    // Determine country & legal confidence tier (1 = France, 2 = EU+US, 3 = UK/CA/OHADA, 4 = Rest of the world)
    const clientCountry = (companyProfile?.country || req.body.country || 'FR').toUpperCase().trim();
    const confidence = determineLegalConfidence(clientCountry);

    // Calculate duration of the commercial relationship
    const relationRefDate = contract.relationshipStartDate || contract.startDate || contract.signatureDate;
    const commercialRelationMonths = calculateRelationshipMonths(relationRefDate);
    const isLongTermFrenchRelation = confidence.level === 1 && commercialRelationMonths >= 24;

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
      // NIVEAU 1 : France (Droit positif, articles 1103/1211 Code civil, Code de commerce, Loi Châtel, mention LRAR, clause de réserve de droits, vérification L. 442-1)
      systemPrompt = `Tu es un avocat d'affaires expert en contentieux et négociation contractuelle B2B en France (Niveau de confiance juridique 1 : Droit positif français).
Tu rédiges des courriers juridiques d'une rigueur absolue, conformes aux usages commerciaux français et au droit positif français :
- Articles 1103 (force obligatoire des contrats) et 1211 (résiliation des contrats à durée indéterminée / fin de terme) du Code civil.
- Respect scrupuleux du délai de préavis contractuel de ${noticeDesc}.
- Mentions d'envoi formel en Lettre Recommandée avec Accusé de Réception (LRAR).
- Ordre formel de cessation immédiate des prestations et des prélèvements bancaires automatiques à la date d'échéance.
- Demande formelle d'un accusé de réception et confirmation écrite de résiliation.
- CLAUSE OBLIGATOIRE DE RÉSERVE DE DROITS : Tu DOIS systématiquement insérer dans le courrier la clause expresse : « Le présent courrier est émis sous la plus expresse réserve de tous nos droits et actions. »

${isLongTermFrenchRelation ? `IMPORTANT - VÉRIFICATION RELATION COMMERCIALE ÉTABLIE (> 24 MOIS) :
La relation commerciale globale avec ce fournisseur dure depuis environ ${commercialRelationMonths} mois (${(commercialRelationMonths / 12).toFixed(1)} ans, débutée le ${relationRefDate || 'non précisé'}).
Au titre de l'article L. 442-1 II du Code de commerce (prévention de la rupture brutale des relations commerciales établies), mentionne poliment mais fermement que l'ancienneté des relations a été prise en compte, que le préavis notifié respecte la loyauté des échanges commerciaux, et rappelle que l'entreprise entend clore les relations d'affaires dans des conditions régulières sans préjudice réciproque.` : ''}`;

      userPrompt = `Rédige un courrier officiel et juridique français pour :
Objet : ${requestedType}
Fournisseur destinataire : ${vendorName}
Adresse de résiliation (si connue) : ${terminationAddr}
Nom de l'entreprise émettrice : ${finalCompanyName}
Coordonnées émetteur : ${finalSignatoryName}, ${finalSignatoryTitle}, ${finalAddress}
Numéro de contrat / Référence : ${contractNum}
Montant annuel / mensuel : ${contract.amount || 'N/C'} ${contract.currency || 'EUR'} (${contract.paymentFrequency || contract.billingFrequency || 'mensuel'})
Date de début de relation commerciale : ${contract.relationshipStartDate || contract.startDate || 'Non spécifiée'} (Durée cumulée : ${commercialRelationMonths} mois)
Date d'échéance du contrat : ${contract.endDate || '[Date de fin]'}
Préavis contractuel : ${noticeDesc}
Motif spécifique : ${noteReason}

Le courrier doit être entièrement rédigé et prêt à être expédié (avec en-tête complet, objet formel avec mention LRAR, corps du texte juridique rigoureux avec références aux articles 1103 et 1211 du Code civil, clause de réserve de droits, formules de politesse juridiques, et bloc de signature).`;

    } else if (confidence.level === 2) {
      // NIVEAU 2 : Union Européenne (hors FR) + USA
      const isUS = confidence.isUSA;
      systemPrompt = `You are a senior commercial lawyer specialized in B2B contract termination (Legal Confidence Level 2: ${isUS ? 'United States Jurisdictions' : `European Union Member State: ${confidence.country}`}).
CRITICAL DIRECTIVES FOR LEVEL 2:
1. Tone: Formal, firm, assertive, and legally prudent commercial letter.
2. Contractual notice: Strictly enforce the agreed contractual notice period (${noticeDesc}) and effective termination date (${contract.endDate || '[Effective Date]'}).
3. ${isUS ? `UNITED STATES JURISDICTION SPECIFICS:
   - Note that 49 US States are governed by Common Law principles, while Louisiana operates under a Civil Law tradition.
   - For general US contracts: Strictly adhere to the written contract terms, notice mechanics, and covenant compliance. DO NOT cite unverified external statutory codes or federal statutes.
   - For Louisiana: Blend civil contract obligations with standard commercial termination requirements.
   - Demand immediate cessation of services, recurring invoices, and payment authorizations on the effective date.` : `EUROPEAN UNION SPECIFICS:
   - Strict statutory prudence: DO NOT cite specific national codes or domestic legal articles (since transposition varies across EU member states).
   - Use standard EU commercial phrasing such as "in accordance with the agreed contractual notice period under our agreement and applicable European commercial protection principles".`}
4. MANDATORY RESERVATION OF RIGHTS: You MUST include the explicit reservation clause: ${isUS || confidence.country !== 'BE' && confidence.country !== 'LU' ? '"This notice is delivered with all rights, claims, remedies, and defenses strictly and expressly reserved."' : '"La présente notification est transmise sous la plus expresse réserve de tous nos droits et actions."'}
5. Complete ready-to-send structure: Full header, registered mail notice ("REGISTERED MAIL / CERTIFIED MAIL"), explicit termination demand, cessation of direct debits, and request for prompt written confirmation.`;

      userPrompt = `Draft a formal Level 2 contract termination notice for:
Subject / Purpose: ${requestedType}
Recipient Vendor: ${vendorName}
Vendor Termination Address: ${terminationAddr}
Client Company: ${finalCompanyName} (Country: ${confidence.country})
Signatory: ${finalSignatoryName}, ${finalSignatoryTitle}
Client Address: ${finalAddress}
Contract Reference / ID: ${contractNum}
Financial Terms: ${contract.amount || 'N/A'} ${contract.currency || (isUS ? 'USD' : 'EUR')} (${contract.paymentFrequency || 'monthly'})
Contract Expiration Date: ${contract.endDate || '[Effective Date]'}
Agreed Notice Period: ${noticeDesc}
Specific Reason / Notes: ${noteReason}

Remember: Strict Level 2 legal prudence — enforce the written contract terms and notice period, include the mandatory reservation of rights clause, and avoid quoting unverified specific statutory articles.`;

    } else if (confidence.level === 3) {
      // NIVEAU 3 : UK, Canada & Espace OHADA
      const isOHADA = confidence.isOHADA;
      const isFrenchSpeaking = isOHADA;

      systemPrompt = `You are an international business contracts counsel (Legal Confidence Level 3: ${isOHADA ? `OHADA Commercial Space (${confidence.country})` : `UK / Canadian Contract Law (${confidence.country})`}).
CRITICAL DIRECTIVES FOR LEVEL 3:
1. Purely contractual foundation:
   ${isOHADA ? `- For the OHADA commercial zone: Formulate the letter with prudent commercial phrasing based on the written agreement, with allowable general reference to the uniform principles of the OHADA Uniform Act on General Commercial Law (Acte uniforme OHADA portant sur le droit commercial général). Draft in French.` : `- For UK and Canada: The termination MUST rely strictly and solely on the written terms of the agreement itself ("strictly under the terms and notice conditions of our agreement"). DO NOT cite any external statutory or legislative acts. Draft in formal English.`}
2. Tone: Formal, definitive, clear, and commercially strict.
3. Explicit demands: Specify the exact effective date of termination, require immediate cancellation of all scheduled deliverables and recurring automatic payments, and demand written confirmation of account closure.
4. MANDATORY RESERVATION OF RIGHTS: You MUST include the explicit reservation of rights clause:
   ${isFrenchSpeaking ? '« La présente lettre est adressée sous réserve de tous nos droits et actions. »' : '"This notice is provided strictly under the terms of the agreement, with all rights, claims, and remedies expressly reserved."'}
5. Header & Delivery: Include formal headers, sender/recipient blocks, registered delivery notice, and signature line.`;

      userPrompt = `Draft a formal Level 3 contract termination letter for:
Subject: ${requestedType}
Vendor: ${vendorName}
Vendor Address: ${terminationAddr}
Client Company: ${finalCompanyName} (Country: ${confidence.country})
Signatory: ${finalSignatoryName}, ${finalSignatoryTitle}
Client Address: ${finalAddress}
Contract Reference: ${contractNum}
Amount: ${contract.amount || 'N/A'} ${contract.currency || (isOHADA ? 'XOF/EUR' : 'GBP/CAD/USD')} (${contract.paymentFrequency || 'monthly'})
End Date: ${contract.endDate || '[Effective Date]'}
Notice Period: ${noticeDesc}
Reason: ${noteReason}

Remember: Purely contractual grounding, appropriate OHADA/UK/Canada phrasing, and include the mandatory reservation of rights clause.`;

    } else {
      // NIVEAU 4 : Reste du monde / pays non listés (Minimaliste et purement factuel)
      systemPrompt = `You are an international business letter specialist (Legal Confidence Level 4: International & Unlisted Jurisdictions).
CRITICAL DIRECTIVES FOR LEVEL 4:
1. Minimalist and factual: The letter must be concise, factual, and strictly focused on recalling the contract identifier, the agreed terms, the notice given, and the desired effective date of termination.
2. ZERO LEGAL OR STATUTORY REFERENCES: Absolutely DO NOT cite any laws, codes, judicial statutes, or national legal acts.
3. Core requirements:
   - State the contract reference and vendor name.
   - State clearly that the agreement will end on the specified date following the contractual notice.
   - Request discontinuation of services and immediate stop of automatic recurring billing.
   - Request written acknowledgment of receipt.
4. MANDATORY RESERVATION OF RIGHTS: Include the clause: "This notification is issued with all rights and remedies expressly reserved."
5. Language: Formal English (or French if requested by the input).`;

      userPrompt = `Draft a clean, minimalist, and factual Level 4 contract termination letter for:
Subject: ${requestedType}
Vendor: ${vendorName}
Vendor Address: ${terminationAddr}
Client Company: ${finalCompanyName} (Country: ${confidence.country})
Signatory: ${finalSignatoryName}, ${finalSignatoryTitle}
Client Address: ${finalAddress}
Contract Reference: ${contractNum}
Financials: ${contract.amount || 'N/A'} ${contract.currency || 'USD'} (${contract.paymentFrequency || 'monthly'})
Effective End Date: ${contract.endDate || '[Effective Date]'}
Contractual Notice: ${noticeDesc}
Notes/Reason: ${noteReason}

Remember: Minimalist, factual, no legal citations, with reservation of rights clause.`;
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
      commercialRelationMonths,
      isLongTermFrenchRelation,
      hasL442Warning: isLongTermFrenchRelation,
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

// Synchronisation non-bloquante vers Google Sheets (Apps Script Webhook)
async function syncWaitlistToGoogleSheet(data: {
  email: string;
  company: string;
  contractCount: number | string;
}): Promise<void> {
  const webhookUrl =
    process.env.GOOGLE_SHEET_WEBHOOK_URL ||
    'https://script.google.com/macros/s/AKfycbzsRHTmncDixFtTvbbabG_n7_Uv6vB8JbQdD3KSK-DfByr-Ar3BZfC1RiXwAIuqfDeN/exec';

  if (!webhookUrl) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        company: data.company,
        contractCount: data.contractCount,
      }),
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[Google Sheets Webhook] Erreur HTTP ${response.status} (${response.statusText}) lors de la synchronisation de l'email ${data.email}`
      );
    }
  } catch (err: any) {
    console.error(
      `[Google Sheets Webhook] Erreur lors de la synchronisation de l'email ${data.email} vers Google Sheets (non-bloquant):`,
      err?.message || err
    );
  }
}

// 1. Capture early access waitlist email
apiRouter.post('/waitlist', async (req, res) => {
  try {
    const { email, companyName, company, contractsCount, contractCount } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner une adresse email valide.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const resolvedCompany = String(companyName || company || '').trim();
    const resolvedContractsCount =
      contractCount !== undefined
        ? contractCount
        : contractsCount !== undefined
        ? contractsCount
        : '';

    const waitlist = loadWaitlist();

    const existingIndex = waitlist.findIndex((e) => e.email.toLowerCase() === cleanEmail);
    const entry: WaitlistEntry = {
      email: cleanEmail,
      companyName: resolvedCompany,
      contractsCount: resolvedContractsCount,
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

    // Sauvegarde principale dans data/waitlist.json (source de vérité)
    saveWaitlist(waitlist);

    // Synchronisation non-bloquante vers Google Sheets
    try {
      await syncWaitlistToGoogleSheet({
        email: cleanEmail,
        company: resolvedCompany,
        contractCount: resolvedContractsCount,
      });
    } catch (sheetErr: any) {
      console.error(
        '[Google Sheets Webhook] Erreur inattendue pendant syncWaitlistToGoogleSheet:',
        sheetErr?.message || sheetErr
      );
    }

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
