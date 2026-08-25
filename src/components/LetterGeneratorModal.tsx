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
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyProfile, Contract } from '../types';
import { formatDateFr } from '../utils/contractUtils';

interface LetterGeneratorModalProps {
  contract: Contract | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onLetterGenerated: (contractId: string, letterText: string) => void;
}

export const LetterGeneratorModal: React.FC<LetterGeneratorModalProps> = ({
  contract,
  companyProfile,
  isOpen,
  onClose,
  onLetterGenerated,
}) => {
  if (!isOpen || !contract) return null;

  const [reason, setReason] = useState<string>(
    "Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis."
  );
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterContent, setLetterContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate fallback letter if offline or upon opening
  const buildFallbackLetter = () => {
    const todayStr = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    return `${companyProfile.companyName}
${companyProfile.address}
${companyProfile.postalCode} ${companyProfile.city}
SIRET : ${companyProfile.siret}
Email : ${companyProfile.email} | Tél : ${companyProfile.phone}

                                            À l'attention de :
                                            ${contract.vendorName}
                                            ${contract.cancellationContact?.recipientName || 'Service Résiliation'}
                                            ${contract.cancellationContact?.address || 'Adresse du fournisseur'}

Fait à ${companyProfile.city}, le ${todayStr}

OBJET : Résiliation du contrat n° ${contract.contractNumber || 'Réf. N/A'}
LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION (LRAR)

Madame, Monsieur,

Par la présente, je vous notifie formellement la décision de notre société, ${companyProfile.companyName}, de résilier le contrat souscrit auprès de vos services sous la référence ${contract.contractNumber || contract.vendorName}.

Conformément aux stipulations contractuelles en vigueur et aux dispositions des articles 1103 et 1211 du Code civil (ainsi qu'aux dispositions applicables du Code de commerce et du Code de la consommation / Loi Châtel le cas échéant), nous entendons mettre fin à nos engagements à la date d'échéance contractuelle du ${formatDateFr(contract.endDate)}, en respectant scrupuleusement le délai de préavis de ${contract.noticePeriodDays} jours.

Motif / Précision :
${reason}

En conséquence, nous vous demandons de bien vouloir cesser l'ensemble des prestations et d'interrompre tout prélèvement automatique sur notre compte bancaire à compter de cette date d'échéance.

Nous vous saurions gré de bien vouloir nous faire parvenir en retour un écrit confirmant la prise en compte de cette résiliation et indiquant la date effective de clôture de notre dossier.

Dans l'attente de votre confirmation écrite, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.


Pour la société ${companyProfile.companyName}
${companyProfile.signatoryName}
${companyProfile.signatoryTitle}

[Signature et cachet de l'entreprise]`;
  };

  // Generate letter via Gemini API
  const generateWithAi = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract,
          companyProfile,
          reason,
          customNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la génération de la lettre.');
      }

      setLetterContent(data.letter);
      onLetterGenerated(contract.id, data.letter);
    } catch (err: any) {
      console.warn('Fallback letter used:', err);
      const fallback = buildFallbackLetter();
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
  }, [contract.id]);

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
    doc.setFontSize(10);
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
              <h2 className="text-lg font-bold text-gray-900">
                Générateur de Lettre de Résiliation Conforme
              </h2>
              <p className="text-xs text-gray-500">
                Droit français des contrats • Mention LRAR • {contract.vendorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Motive & Legal options bar */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Sélectionner le fondement / motif juridique de résiliation :</span>
              </label>
              <button
                type="button"
                onClick={generateWithAi}
                disabled={isGenerating}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 flex items-center space-x-1 transition-colors"
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
              onChange={(e) => {
                setReason(e.target.value);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-gray-800"
            >
              <option value="Résiliation à l'échéance contractuelle avec respect du délai de préavis.">
                1. Échéance normale du terme contractuel avec respect du préavis légal/contractuel ({contract.noticePeriodDays}j)
              </option>
              <option value="Résiliation pour non-respect de l'obligation d'information sur la reconduction tacite (Loi Châtel / Art. L. 215-1 Code de la consommation pour professionnel assimilé).">
                2. Loi Châtel / Défaut d'information préalable de reconduction tacite
              </option>
              <option value="Résiliation pour modification unilatérale des tarifs ou conditions générales de vente par le prestataire.">
                3. Modification tarifaire unilatérale / Changement de CGV par le fournisseur
              </option>
              <option value="Résiliation pour manquement répété aux obligations contractuelles et qualité de service non conforme.">
                4. Manquement contractuel / Inexécution partielle des prestations
              </option>
              <option value="Résiliation pour motif légitime (réorganisation d'activité, déménagement des locaux professionnels).">
                5. Réorganisation d'activité / Déménagement de l'entreprise
              </option>
            </select>
          </div>

          {/* Letter Preview & Editable Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>Aperçu de la lettre (texte éditable) :</span>
              <span className="text-[11px] font-normal text-gray-500">
                Vous pouvez modifier le texte directement ci-dessous avant export
              </span>
            </div>

            <div className="relative">
              {isGenerating ? (
                <div className="h-96 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-gray-700">
                    Rédaction de la lettre formelle par l'IA en cours...
                  </p>
                </div>
              ) : (
                <textarea
                  id="textarea-letter-content"
                  rows={16}
                  value={letterContent}
                  onChange={(e) => setLetterContent(e.target.value)}
                  className="w-full p-4 text-xs font-mono bg-white border border-gray-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:outline-none shadow-inner text-gray-800"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200/80 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>

          <div className="flex items-center space-x-2">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copier le texte</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Imprimer</span>
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
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
