import React, { useState, useEffect } from 'react';
import {
  X,
  FileSignature,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  Loader2,
  AlertCircle,
  Building,
  Scale,
  FileText,
  Shield,
  Globe,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyProfile, Contract } from '../types';
import { formatDateFr } from '../utils/contractUtils';
import {
  getLegalConfidenceLevel,
  LegalConfidenceInfo,
  calculateRelationshipDurationMonths,
  isRelationOver24Months,
  LEGAL_DISCLAIMER_TEXT,
} from '../utils/countryUtils';

interface LetterGeneratorModalProps {
  contract: Contract | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onLetterGenerated: (contractId: string, letterText: string) => void;
  onOpenCompanyModal?: () => void;
}

export const LetterGeneratorModal: React.FC<LetterGeneratorModalProps> = ({
  contract,
  companyProfile,
  isOpen,
  onClose,
  onLetterGenerated,
  onOpenCompanyModal,
}) => {
  if (!isOpen || !contract) return null;

  const isProfileIncomplete =
    !companyProfile.companyName?.trim() ||
    !companyProfile.address?.trim() ||
    !companyProfile.signatoryName?.trim();

  const isLongTermFR =
    (companyProfile?.country || 'FR').toUpperCase() === 'FR' && isRelationOver24Months(contract);
  const relationMonths = calculateRelationshipDurationMonths(
    contract.relationshipStartDate || contract.startDate || contract.signatureDate
  );

  const [reason, setReason] = useState<string>(
    "Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis."
  );
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterContent, setLetterContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedLegalTier, setAppliedLegalTier] = useState<LegalConfidenceInfo>(() =>
    getLegalConfidenceLevel(companyProfile?.country || 'FR')
  );

  // Update tier whenever company profile changes
  useEffect(() => {
    setAppliedLegalTier(getLegalConfidenceLevel(companyProfile?.country || 'FR'));
  }, [companyProfile?.country]);

  // Generate fallback letter respecting the 4 levels
  const buildFallbackLetter = (tier: LegalConfidenceInfo) => {
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

    const companyName = companyProfile.companyName || '[Company Name]';
    const signatoryName = companyProfile.signatoryName || '[Authorized Signatory]';
    const signatoryTitle = companyProfile.signatoryTitle || 'Managing Director';
    const fullAddress = `${companyProfile.address || ''}, ${companyProfile.postalCode || ''} ${companyProfile.city || ''}`.trim() || '[Company Address]';
    const contractNum = contract.contractNumber || contract.id || 'N/A';
    const noticeDays = contract.noticePeriodDays ? `${contract.noticePeriodDays} days` : '30 days';
    const vendorAddress = contract.cancellationContact?.address || 'Vendor Termination Service';

    if (tier.level === 1) {
      // LEVEL 1 (France)
      return `${companyName}
${companyProfile.address}
${companyProfile.postalCode} ${companyProfile.city}
SIRET : ${companyProfile.siret || 'N/C'}
Email : ${companyProfile.email} | Tél : ${companyProfile.phone}

                                            À l'attention de :
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Service Résiliation'}
                                            ${vendorAddress}

Fait à ${companyProfile.city || 'Paris'}, le ${todayFr}

OBJET : Résiliation du contrat n° ${contractNum}
LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION (LRAR)

Madame, Monsieur,

Par la présente, je vous notifie formellement la décision de notre société, ${companyName}, de résilier le contrat souscrit auprès de vos services sous la référence ${contractNum}.

Conformément aux stipulations contractuelles en vigueur et aux dispositions des articles 1103 et 1211 du Code civil (ainsi qu'aux dispositions applicables du Code de commerce et de la Loi Châtel / Art. L. 215-1 du Code de la consommation le cas échéant), nous entendons mettre fin à nos engagements à la date d'échéance contractuelle du ${formatDateFr(contract.endDate)}, en respectant scrupuleusement le délai de préavis de ${contract.noticePeriodDays || 30} jours.

${isLongTermFR ? `Au titre de l'article L. 442-1 II du Code de commerce (prévention de la rupture brutale des relations commerciales établies), nous soulignons que notre préavis de notification respecte scrupuleusement les exigences de loyauté et l'historique de notre collaboration commerciale débutée le ${contract.relationshipStartDate || contract.startDate || 'N/C'}.\n` : ''}
Motif / Précision :
${reason}

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
      const isUS = companyProfile?.country === 'US' || companyProfile?.country === 'USA';
      return `${companyName}
${fullAddress}
Registration / Tax ID: ${companyProfile.siret || 'N/A'}
Contact: ${companyProfile.email || ''} | ${companyProfile.phone || ''}

                                            To:
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Contract Management / Cancellations'}
                                            ${vendorAddress}

Date: ${todayEn}

SUBJECT: FORMAL CONTRACT TERMINATION NOTICE - REF: ${contractNum}
REGISTERED DELIVERY WITH ACKNOWLEDGMENT OF RECEIPT

Dear Vendor Management Team,

We hereby formally notify you on behalf of ${companyName} of our decision to terminate our contract entered into under reference ${contractNum}.

In accordance with the agreed contractual notice period under our agreement (${noticeDays}) and ${isUS ? 'governing contractual covenants' : 'applicable European commercial protection principles'}, our agreement shall definitively end on the contract expiration date of ${contract.endDate || '[Effective Date]'}.

Stated Reason:
${reason}

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
      // LEVEL 3 (UK, Canada, OHADA)
      const isOHADA = tier.jurisdictionCategory === 'UK_CA_OHADA' && companyProfile.country && companyProfile.country !== 'GB' && companyProfile.country !== 'UK' && companyProfile.country !== 'CA';
      return `${companyName}
${fullAddress}
${isOHADA ? `RCCM / NINEA : ${companyProfile.siret || 'N/C'}` : `Company Number / Registration: ${companyProfile.siret || 'N/A'}`}
Email : ${companyProfile.email || ''}

                                            To / À l'attention de :
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Contract / Account Services'}
                                            ${vendorAddress}

Date : ${todayEn}

SUBJECT / OBJET : CONTRACT TERMINATION NOTICE / NOTIFICATION DE RÉSILIATION - REF #${contractNum}

${isOHADA ? `Madame, Monsieur,\n\nPar la présente, notre société ${companyName} vous notifie formellement la résiliation du contrat n° ${contractNum} à sa date d'échéance contractuelle du ${formatDateFr(contract.endDate)}, en application des stipulations contractuelles et des principes de l'Acte uniforme OHADA portant sur le droit commercial général.` : `Dear Sir/Madam,\n\nPlease accept this letter as formal written notice strictly in accordance with the terms of our agreement that ${companyName} is terminating contract #${contractNum} with ${contract.vendorName}, effective on ${contract.endDate || '[Effective Date]'} following the agreed notice period of ${noticeDays}.`}

${reason}

${isOHADA ? 'Tous droits et recours demeurent expressément réservés.' : 'This notice is given strictly under the contractual terms, with all rights and remedies strictly reserved.'}

${isOHADA ? 'Nous vous prions d\'agréer, Madame, Monsieur, nos salutations distinguées.' : 'Sincerely,'}

${signatoryName}
${signatoryTitle}
${companyName}`;
    }

    // LEVEL 4 (International / Rest of the World)
    return `${companyName}
${fullAddress}
Registration: ${companyProfile.siret || 'N/A'}
Email: ${companyProfile.email || ''}

                                            To:
                                            ${contract.vendorName}
                                            Attn: ${contract.cancellationContact?.recipientName || 'Contract / Account Services'}
                                            ${vendorAddress}

Date: ${todayEn}

SUBJECT: NOTICE OF CONTRACT TERMINATION - CONTRACT #${contractNum}

Dear Sir/Madam,

Please accept this letter as formal written notice that ${companyName} is terminating the contract referenced as #${contractNum} with ${contract.vendorName}.

This termination is exercised in accordance with the terms and notice conditions set out in our agreement, with an effective termination date of ${contract.endDate || '[Effective Date]'} after fulfilling the required notice period of ${noticeDays}.

Purpose / Detail:
${reason}

From the effective termination date onwards, please cancel all scheduled services and deactivate any recurring automatic payment authorizations associated with this agreement.

All rights and remedies under the contract are expressly reserved.

Kindly return a signed written acknowledgment confirming receipt of this termination notice and the final settlement of the account.

Respectfully yours,

${signatoryName}
${signatoryTitle}
${companyName}

__________________________________________________
[Notice: This document is formulated on a purely factual and contractual basis. Due to varying local jurisdictional requirements, formal review by a qualified legal professional in your country is recommended.]`;
  };

  // Generate letter via API
  const generateWithAi = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    const currentTier = getLegalConfidenceLevel(companyProfile?.country || 'FR');
    setAppliedLegalTier(currentTier);

    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract,
          companyProfile: {
            ...companyProfile,
            country: companyProfile?.country || 'FR',
          },
          reason,
          customNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la génération de la lettre.');
      }

      setLetterContent(data.letter);
      if (data.legalConfidenceLevel) {
        setAppliedLegalTier(getLegalConfidenceLevel(companyProfile?.country || 'FR'));
      }
      onLetterGenerated(contract.id, data.letter);
    } catch (err: any) {
      console.warn('Fallback letter used:', err);
      const fallback = buildFallbackLetter(currentTier);
      setLetterContent(fallback);
      onLetterGenerated(contract.id, fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (contract) {
      generateWithAi();
    }
  }, [contract.id, companyProfile?.country]);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download plain text
  const handleDownloadTxt = () => {
    const blob = new Blob([letterContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lettre_Resiliation_${contract.vendorName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download PDF using jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(33, 37, 41);

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(letterContent, maxLineWidth);
    doc.text(lines, margin, margin);

    doc.save(`Lettre_Resiliation_${contract.vendorName.replace(/\s+/g, '_')}.pdf`);
  };

  // Browser Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lettre de Résiliation - ${contract.vendorName}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #111; padding: 40px; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <pre>${letterContent}</pre>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/80 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileSignature className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-gray-900">
                  Générateur de Lettre de Résiliation
                </h2>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${appliedLegalTier.badgeStyle}`}>
                  {appliedLegalTier.badgeText}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Fournisseur : <span className="font-semibold text-gray-700">{contract.vendorName}</span> • Préavis : <span className="font-semibold text-gray-700">{contract.noticePeriodDays || 30} jours</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Company Profile Incomplete Alert */}
          {isProfileIncomplete && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Profil de votre entreprise incomplet :</span>
                  <p className="text-[11px] text-amber-800">
                    Pour que votre lettre soit directement exploitable et valide (en-tête, SIRET, adresse et signataire), complétez les informations de votre entreprise.
                  </p>
                </div>
              </div>
              {onOpenCompanyModal && (
                <button
                  type="button"
                  onClick={onOpenCompanyModal}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-[11px] rounded-lg shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  Compléter profil
                </button>
              )}
            </div>
          )}

          {/* Motive & Legal options bar */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Motif et cadre de la résiliation :</span>
              </label>
              <button
                type="button"
                onClick={generateWithAi}
                disabled={isGenerating}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Régénérer avec l'IA</span>
              </button>
            </div>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-gray-800"
            >
              <option value="Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis.">
                1. Échéance normale du terme contractuel avec respect du préavis ({contract.noticePeriodDays || 30}j)
              </option>
              {appliedLegalTier.level === 1 && (
                <option value="Résiliation pour non-respect de l'obligation d'information sur la reconduction tacite (Loi Châtel / Art. L. 215-1 Code de la consommation pour professionnel assimilé).">
                  2. Loi Châtel / Défaut d'information préalable de reconduction tacite (France)
                </option>
              )}
              <option value="Résiliation pour modification unilatérale des tarifs ou conditions contractuelles par le prestataire.">
                3. Modification unilatérale de tarifs / Modification unilatérale de contrat
              </option>
              <option value="Résiliation pour manquement répété aux obligations contractuelles et qualité de service non conforme.">
                4. Manquement contractuel / Inexécution des engagements de service
              </option>
              <option value="Résiliation pour motif légitime (restructuration d'activité, optimisation des dépenses).">
                5. Restructuration d'activité / Réduction des coûts
              </option>
            </select>
          </div>

          {/* French Long-Term Commercial Relationship Risk Alert (Art. L. 442-1 Code de commerce) */}
          {isLongTermFR && (
            <div
              id="french-l442-warning"
              className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start space-x-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <span>Avertissement Rupture Brutale des Relations Commerciales Établies (Art. L. 442-1 II C. com.)</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded">
                    Relation ~{relationMonths} mois (&gt; 2 ans)
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Votre relation commerciale avec <strong>{contract.vendorName}</strong> est établie depuis plus de 24 mois. En droit français, un préavis purement contractuel peut être jugé insuffisant par le juge si l'ancienneté exigeait un délai plus long. La lettre ci-dessous a été ajustée pour mentionner la loyauté du préavis et intégrer une clause de réserve de droits.
                </p>
              </div>
            </div>
          )}

          {/* Letter Preview & Editable Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Aperçu du courrier (texte éditable) :</span>
              <span className="text-[11px] font-normal text-gray-500">
                Vous pouvez modifier le texte ci-dessous avant téléchargement
              </span>
            </div>

            <div className="relative">
              {isGenerating ? (
                <div className="h-80 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-gray-700">
                    Rédaction de la lettre formelle conforme en cours...
                  </p>
                </div>
              ) : (
                <textarea
                  id="textarea-letter-content"
                  rows={14}
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  className="w-full p-4 text-xs font-mono bg-white border border-gray-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-inner text-gray-800"
                />
              )}
            </div>
          </div>

          {/* Legal Confidence Disclaimer Banner (Under the generated letter) */}
          <div
            id="legal-confidence-note"
            className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
              appliedLegalTier.level === 1
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : appliedLegalTier.level === 2
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {appliedLegalTier.level === 1 ? (
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : appliedLegalTier.level === 2 ? (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-semibold flex items-center space-x-1.5">
                <span>{appliedLegalTier.note}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-normal">
                {appliedLegalTier.disclaimer}
              </p>
            </div>
          </div>

          {/* Permanent Legal Disclaimer Notice */}
          <div
            id="permanent-legal-disclaimer"
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-500 text-center leading-snug flex items-center justify-center space-x-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{LEGAL_DISCLAIMER_TEXT}</span>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="px-6 py-3.5 border-t border-gray-200/80 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center space-x-2">
            {/* Download plain text */}
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Format .txt</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copier</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Imprimer</span>
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              <span>Télécharger en PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
