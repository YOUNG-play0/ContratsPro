import { CompanyProfile, Contract } from '../types';
import { formatDateFr } from './contractUtils';
import {
  getLegalConfidenceLevel,
  LegalConfidenceInfo,
  calculateRelationshipDurationMonths,
  isRelationOver24Months,
} from './countryUtils';

export interface LetterGenerationOptions {
  contract: Partial<Contract> & {
    vendorName: string;
    contractNumber?: string;
    endDate?: string;
    noticePeriodDays?: number;
    relationshipStartDate?: string;
    startDate?: string;
    signatureDate?: string;
    cancellationContact?: {
      recipientName?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
  };
  companyProfile?: CompanyProfile;
  reason?: string;
  customNotes?: string;
}

export function buildLocalFallbackLetter(options: LetterGenerationOptions): string {
  const { contract, companyProfile, reason, customNotes } = options;
  const country = companyProfile?.country || 'FR';
  const tier = getLegalConfidenceLevel(country);

  const todayFr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const todayEn = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const companyName = companyProfile?.companyName?.trim() || '[Nom de votre entreprise]';
  const signatoryName = companyProfile?.signatoryName?.trim() || '[Nom du dirigeant / signataire]';
  const signatoryTitle = companyProfile?.signatoryTitle?.trim() || 'Gérant / Direction';
  const fullAddress = `${companyProfile?.address || ''}, ${companyProfile?.postalCode || ''} ${companyProfile?.city || ''}`.trim() || '[Adresse postale entreprise]';
  const contractNum = contract.contractNumber || 'N/A';
  const noticeDays = contract.noticePeriodDays ? `${contract.noticePeriodDays} jours` : '30 jours';
  const vendorAddress = contract.cancellationContact?.address || 'Service Résiliation Fournisseur';
  const effectiveEndDate = contract.endDate ? formatDateFr(contract.endDate) : 'la prochaine date d’échéance contractuelle';

  const defaultReason = reason || "Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis.";
  const isLongTermFR = country.toUpperCase() === 'FR' && isRelationOver24Months(contract as any);

  if (tier.level === 1) {
    // LEVEL 1 (France - Mention légale LRAR + Code civil + L.442-1 II si relation > 24m)
    return `${companyName}
${companyProfile?.address || ''}
${companyProfile?.postalCode || ''} ${companyProfile?.city || ''}
SIRET : ${companyProfile?.siret || 'N/C'}
Email : ${companyProfile?.email || ''} | Tél : ${companyProfile?.phone || ''}

                                            À l'attention de :
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Service Résiliation'}
                                            ${vendorAddress}

Fait à ${companyProfile?.city || 'Paris'}, le ${todayFr}

OBJET : Résiliation du contrat n° ${contractNum}
LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION (LRAR)

Madame, Monsieur,

Par la présente, je vous notifie formellement la décision de notre société, ${companyName}, de résilier le contrat souscrit auprès de vos services sous la référence ${contractNum}.

Conformément aux stipulations contractuelles en vigueur et aux dispositions des articles 1103 et 1211 du Code civil (ainsi qu'aux dispositions applicables du Code de commerce et de la Loi Châtel / Art. L. 215-1 du Code de la consommation le cas échéant), nous entendons mettre fin à nos engagements à la date d'échéance contractuelle du ${effectiveEndDate}, en respectant scrupuleusement le délai de préavis de ${noticeDays}.

${isLongTermFR ? `Au titre de l'article L. 442-1 II du Code de commerce (prévention de la rupture brutale des relations commerciales établies), nous soulignons que notre préavis de notification respecte scrupuleusement les exigences de loyauté et l'historique de notre collaboration commerciale débutée le ${contract.relationshipStartDate || contract.startDate || 'N/C'}.\n` : ''}
Motif / Précision :
${defaultReason}${customNotes ? `\n\nPrécisions complémentaires :\n${customNotes}` : ''}

En conséquence, nous vous demandons de bien vouloir cesser l'ensemble des prestations et d'interrompre tout prélèvement automatique sur notre compte bancaire à compter de cette date d'échéance.

La présente notification est transmise sous la plus expresse réserve de tous nos droits et actions.

Nous vous saurions gré de bien vouloir nous faire parvenir en retour un écrit confirmant la prise en compte de cette résiliation et indiquant la date effective de clôture de notre dossier.

Dans l'attente de votre confirmation écrite, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.


Pour la société ${companyName}
${signatoryName}
${signatoryTitle}

[Signature et cachet de l'entreprise]`;
  }

  if (tier.level === 2) {
    // LEVEL 2 (EU + USA)
    const isUS = country === 'US' || country === 'USA';
    return `${companyName}
${fullAddress}
Tax ID / Registration: ${companyProfile?.siret || 'N/A'}
Email: ${companyProfile?.email || ''} | Phone: ${companyProfile?.phone || ''}

                                            To the attention of:
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Termination & Cancellation Service'}
                                            ${vendorAddress}

Date: ${todayEn}

SUBJECT: FORMAL CONTRACT TERMINATION NOTICE - REF: ${contractNum}
REGISTERED DELIVERY WITH ACKNOWLEDGMENT OF RECEIPT

Dear Vendor Management Team,

We hereby formally notify you on behalf of ${companyName} of our decision to terminate our contract entered into under reference ${contractNum}.

In accordance with the agreed contractual notice period under our agreement (${noticeDays}) and ${isUS ? 'governing contractual covenants' : 'applicable European commercial protection principles'}, our agreement shall definitively end on the contract expiration date of ${effectiveEndDate}.

Stated Reason:
${defaultReason}${customNotes ? `\n\nAdditional Notes:\n${customNotes}` : ''}

Accordingly, please ensure that all service deliverables and corresponding recurring billing or direct debit transactions cease immediately upon this date.

This notice is delivered with all rights, claims, remedies, and defenses strictly and expressly reserved.

Please provide formal written confirmation acknowledging receipt of this notice and confirming final closure of our account.

Sincerely,

For and on behalf of ${companyName}
${signatoryName}
${signatoryTitle}

[Official Signature & Seal]`;
  }

  if (tier.level === 3) {
    // LEVEL 3 (OHADA, UK, Canada)
    const isOHADA = tier.jurisdictionCategory === 'UK_CA_OHADA' && country !== 'GB' && country !== 'UK' && country !== 'CA';
    return `${companyName}
${fullAddress}
${isOHADA ? `RCCM / NINEA : ${companyProfile?.siret || 'N/C'}` : `Company Number / Registration: ${companyProfile?.siret || 'N/A'}`}
Email : ${companyProfile?.email || ''}

                                            To / À l'attention de :
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Contract / Account Services'}
                                            ${vendorAddress}

Date : ${todayEn}

SUBJECT / OBJET : CONTRACT TERMINATION NOTICE / NOTIFICATION DE RÉSILIATION - REF #${contractNum}

${isOHADA ? `Madame, Monsieur,\n\nPar la présente, notre société ${companyName} vous notifie formellement la résiliation du contrat n° ${contractNum} à sa date d'échéance contractuelle du ${effectiveEndDate}, en application des stipulations contractuelles et des principes de l'Acte uniforme OHADA portant sur le droit commercial général.` : `Dear Sir/Madam,\n\nPlease accept this letter as formal written notice strictly in accordance with the terms of our agreement that ${companyName} is terminating contract #${contractNum} with ${contract.vendorName}, effective on ${effectiveEndDate} following the agreed notice period of ${noticeDays}.`}

${defaultReason}${customNotes ? `\n\n${customNotes}` : ''}

${isOHADA ? 'Tous droits et recours demeurent expressément réservés.' : 'This notice is given strictly under the contractual terms, with all rights and remedies strictly reserved.'}

${isOHADA ? "Nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées." : 'Sincerely,'}

${signatoryName}
${signatoryTitle}
${companyName}`;
  }

  // LEVEL 4 (International)
  return `${companyName}
${fullAddress}
Registration: ${companyProfile?.siret || 'N/A'}
Email: ${companyProfile?.email || ''}

                                            To:
                                            ${contract.vendorName}
                                            Attn: ${contract.cancellationContact?.recipientName || 'Contract / Account Services'}
                                            ${vendorAddress}

Date: ${todayEn}

SUBJECT: NOTICE OF CONTRACT TERMINATION - CONTRACT #${contractNum}

Dear Sir/Madam,

Please accept this letter as formal written notice that ${companyName} is terminating the contract referenced as #${contractNum} with ${contract.vendorName}.

This termination is exercised in accordance with the terms and notice conditions set out in our agreement, with an effective termination date of ${effectiveEndDate} after fulfilling the required notice period of ${noticeDays}.

Purpose / Detail:
${defaultReason}${customNotes ? `\n\n${customNotes}` : ''}

From the effective termination date onwards, please cancel all scheduled services and deactivate any recurring automatic payment authorizations associated with this agreement.

All rights and remedies under the contract are expressly reserved.

Kindly return a signed written acknowledgment confirming receipt of this termination notice and the final settlement of the account.

Respectfully yours,

${signatoryName}
${signatoryTitle}
${companyName}

__________________________________________________
[Notice: This document is formulated on a purely factual and contractual basis. Due to varying local jurisdictional requirements, formal review by a qualified legal professional in your country is recommended.]`;
}

export async function requestAiOrFallbackLetter(options: LetterGenerationOptions): Promise<string> {
  const fallback = buildLocalFallbackLetter(options);
  try {
    const res = await fetch('/api/generate-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract: options.contract,
        companyProfile: options.companyProfile,
        reason: options.reason || "Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis.",
        customNotes: options.customNotes || '',
      }),
    });

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    if (data.success && data.letter) {
      return data.letter;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
