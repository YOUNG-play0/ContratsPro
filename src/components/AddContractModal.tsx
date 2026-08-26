import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Edit3,
  HelpCircle,
  Building,
  Calendar,
  DollarSign,
  Shield,
  Layers,
  ArrowRight,
  FileUp,
  FileSignature,
  Download,
  Copy,
  ArrowLeft,
  CheckCircle2,
  MailCheck,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CompanyProfile, Contract, ContractCategory, ContractStatus, PaymentFrequency } from '../types';
import { CATEGORY_CONFIG, formatDateFr } from '../utils/contractUtils';
import { calculateRelationshipDurationMonths, isRelationOver24Months } from '../utils/countryUtils';
import { requestAiOrFallbackLetter, buildLocalFallbackLetter } from '../utils/letterGenerator';
import { useLanguage } from '../i18n/LanguageContext';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContract: (newContract: Contract, generatedLetterText?: string) => void;
  companyProfile?: CompanyProfile;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({
  isOpen,
  onClose,
  onSaveContract,
  companyProfile,
}) => {
  const { language } = useLanguage();
  const isFrance = (companyProfile?.country || 'FR').toUpperCase() === 'FR';

  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracted, setIsExtracted] = useState(false);

  // Sub-step for letter generation: 'verify' (form) or 'letter_preview'
  const [step, setStep] = useState<'verify' | 'letter_preview'>('verify');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [generatedLetterText, setGeneratedLetterText] = useState('');
  const [letterReason, setLetterReason] = useState(
    "Résiliation à l'échéance contractuelle annuelle avec respect du délai de préavis."
  );
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Form State (for verification & manual entry)
  const [formData, setFormData] = useState<{
    vendorName: string;
    contractNumber: string;
    category: ContractCategory;
    amount: number;
    currency: string;
    paymentFrequency: PaymentFrequency;
    signatureDate: string;
    startDate: string;
    relationshipStartDate: string;
    commitmentDurationMonths: number;
    endDate: string;
    noticePeriodDays: number;
    tacitRenewal: boolean;
    cancellationRecipient: string;
    cancellationAddress: string;
    cancellationEmail: string;
    cancellationPhone: string;
    keyClauses: string[];
    summary: string;
    status: ContractStatus;
    notes: string;
  }>({
    vendorName: '',
    contractNumber: '',
    category: 'telecom',
    amount: 100,
    currency: 'EUR',
    paymentFrequency: 'mensuel',
    signatureDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    relationshipStartDate: new Date().toISOString().split('T')[0],
    commitmentDurationMonths: 12,
    endDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })(),
    noticePeriodDays: 30,
    tacitRenewal: true,
    cancellationRecipient: 'Service Résiliation',
    cancellationAddress: '',
    cancellationEmail: '',
    cancellationPhone: '',
    keyClauses: ['Reconduction tacite annuelle', 'Préavis de 30 jours par LRAR'],
    summary: '',
    status: 'active',
    notes: '',
  });

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setExtractionError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Run AI Extraction via server endpoint
  const runAiExtraction = async (textToExtract?: string, customFileName?: string) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      let payload: any = {};

      if (textToExtract) {
        payload = {
          text: textToExtract,
          fileName: customFileName || 'contrat_texte.txt',
        };
      } else if (fileBase64 && selectedFile) {
        payload = {
          imageBase64: fileBase64,
          mimeType: selectedFile.type || 'application/pdf',
          fileName: selectedFile.name,
        };
      } else if (pastedText.trim()) {
        payload = {
          text: pastedText,
          fileName: 'contrat_saisi.txt',
        };
      } else {
        throw new Error(
          language === 'fr'
            ? 'Veuillez sélectionner un fichier ou renseigner le texte du contrat.'
            : 'Please select a file or paste contract text.'
        );
      }

      const res = await fetch('/api/extract-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible d’extraire les informations du contrat.');
      }

      const ext = data.extractedData || data.data || data || {};
      setFormData({
        vendorName: ext?.vendorName || '',
        contractNumber: ext?.contractNumber || '',
        category: (ext?.category as ContractCategory) || 'telecom',
        amount: Number(ext?.amount) || 0,
        currency: ext?.currency || 'EUR',
        paymentFrequency: (ext?.paymentFrequency as PaymentFrequency) || 'mensuel',
        signatureDate: ext?.signatureDate || new Date().toISOString().split('T')[0],
        startDate: ext?.startDate || new Date().toISOString().split('T')[0],
        relationshipStartDate:
          ext?.relationshipStartDate || ext?.startDate || new Date().toISOString().split('T')[0],
        commitmentDurationMonths: Number(ext?.commitmentDurationMonths) || 12,
        endDate: ext?.endDate || '',
        noticePeriodDays: Number(ext?.noticePeriodDays) || 30,
        tacitRenewal: ext?.tacitRenewal !== undefined ? Boolean(ext.tacitRenewal) : true,
        cancellationRecipient: ext?.cancellationContact?.recipientName || 'Service Résiliation',
        cancellationAddress: ext?.cancellationContact?.address || '',
        cancellationEmail: ext?.cancellationContact?.email || '',
        cancellationPhone: ext?.cancellationContact?.phone || '',
        keyClauses: Array.isArray(ext?.keyClauses) ? ext.keyClauses : [],
        summary: ext?.summary || '',
        status: (ext?.suggestedStatus as ContractStatus) || 'active',
        notes: '',
      });

      setIsExtracted(true);
      setStep('verify');
    } catch (err: any) {
      console.error(err);
      setExtractionError(err.message || "Erreur lors de l'extraction des données.");
    } finally {
      setIsExtracting(false);
    }
  };

  const validateFormData = (): boolean => {
    if (!formData.vendorName.trim()) {
      setExtractionError(
        language === 'fr' ? 'Le nom du fournisseur est obligatoire.' : 'Vendor name is required.'
      );
      return false;
    }

    if (!formData.endDate) {
      setExtractionError(
        language === 'fr' ? "La date d'échéance est obligatoire." : 'End date is required.'
      );
      return false;
    }

    if (isFrance && !formData.relationshipStartDate) {
      setExtractionError(
        "La date de début de relation commerciale est obligatoire en France (évaluation de l'article L. 442-1 du Code de commerce)."
      );
      return false;
    }

    setExtractionError(null);
    return true;
  };

  const buildContractObject = (): Contract => {
    return {
      id: `ctr-${Date.now()}`,
      vendorName: formData.vendorName.trim(),
      contractNumber: formData.contractNumber.trim() || undefined,
      category: formData.category,
      amount: Number(formData.amount) || 0,
      currency: formData.currency || 'EUR',
      paymentFrequency: formData.paymentFrequency,
      signatureDate: formData.signatureDate || undefined,
      startDate: formData.startDate || undefined,
      relationshipStartDate: formData.relationshipStartDate || undefined,
      commitmentDurationMonths: Number(formData.commitmentDurationMonths) || undefined,
      endDate: formData.endDate,
      noticePeriodDays: Number(formData.noticePeriodDays) || 30,
      tacitRenewal: formData.tacitRenewal,
      cancellationContact: {
        recipientName: formData.cancellationRecipient,
        address: formData.cancellationAddress,
        email: formData.cancellationEmail,
        phone: formData.cancellationPhone,
      },
      keyClauses: formData.keyClauses.filter((k) => k.trim().length > 0),
      summary: formData.summary || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
      attachedFileName: selectedFile?.name || (isExtracted ? 'Contrat_Extrait_IA.pdf' : undefined),
      attachedFileSize: selectedFile
        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} Mo`
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'created',
          description: isExtracted
            ? 'Contrat analysé et extrait automatiquement par IA.'
            : 'Contrat créé manuellement par l’utilisateur.',
        },
      ],
    };
  };

  // 1. Save Contract Directly without Letter
  const handleSaveWithoutLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) return;

    const newContract = buildContractObject();
    onSaveContract(newContract);
    onClose();
  };

  // 2. Generate Letter Step
  const handleStartLetterGeneration = async () => {
    if (!validateFormData()) return;

    setIsGeneratingLetter(true);
    setExtractionError(null);

    const tempContract = buildContractObject();

    try {
      const letterText = await requestAiOrFallbackLetter({
        contract: tempContract,
        companyProfile,
        reason: letterReason,
      });

      setGeneratedLetterText(letterText);
      setStep('letter_preview');
    } catch (err: any) {
      console.warn('Letter generation fallback:', err);
      const fallback = buildLocalFallbackLetter({
        contract: tempContract,
        companyProfile,
        reason: letterReason,
      });
      setGeneratedLetterText(fallback);
      setStep('letter_preview');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  // 3. Finalize Save (Contract + Letter) in one click
  const handleSaveContractAndLetter = () => {
    if (!validateFormData()) return;

    const newContract = buildContractObject();
    newContract.lastGeneratedLetter = generatedLetterText;
    newContract.status = newContract.status === 'active' ? 'cancel_pending' : newContract.status;
    newContract.actions = [
      ...(newContract.actions || []),
      {
        id: `act-${Date.now() + 1}`,
        date: new Date().toISOString(),
        type: 'letter_generated',
        description: 'Lettre de résiliation formelle générée dès la création du contrat.',
      },
    ];

    onSaveContract(newContract, generatedLetterText);
    onClose();
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetterText);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const margin = 20;
    const pageWidth = 210;
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(generatedLetterText, maxLineWidth);

    let cursorY = 25;
    const lineHeight = 5.2;

    lines.forEach((line: string) => {
      if (cursorY > 275) {
        doc.addPage();
        cursorY = 25;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    const safeVendor = (formData.vendorName || 'fournisseur')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    doc.save(`Lettre_Resiliation_${safeVendor}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center border border-indigo-100 font-bold">
              {step === 'letter_preview' ? (
                <FileSignature className="w-5 h-5" />
              ) : isExtracted ? (
                <Sparkles className="w-5 h-5 text-indigo-600" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {step === 'letter_preview'
                  ? language === 'fr'
                    ? 'Lettre de résiliation prête'
                    : 'Termination Letter Ready'
                  : isExtracted
                  ? language === 'fr'
                    ? 'Vérification des données extraites'
                    : 'Verify Extracted Contract Data'
                  : language === 'fr'
                  ? 'Ajouter & Analyser un contrat B2B'
                  : 'Add & Analyze B2B Contract'}
              </h2>
              <p className="text-xs text-gray-500">
                {step === 'letter_preview'
                  ? language === 'fr'
                    ? 'Aperçu du courrier officiel à notifier au fournisseur'
                    : 'Review formal notice to be sent to the vendor'
                  : isExtracted
                  ? language === 'fr'
                    ? 'Vérifiez les dates, montants et coordonnées avant validation'
                    : 'Review dates, amounts and termination details before saving'
                  : language === 'fr'
                  ? 'Importez un document (PDF/Image) pour extraction automatique par IA'
                  : 'Upload PDF or paste document for instant AI extraction'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {extractionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{extractionError}</span>
            </div>
          )}

          {/* STEP 1: Upload / Input Screen */}
          {!isExtracted && step === 'verify' && (
            <div className="space-y-6">
              {/* Tab selector */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'upload'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {language === 'fr'
                      ? 'Importer un document (PDF / Image)'
                      : 'Upload Document (PDF / Image)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
                    activeTab === 'manual'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>
                    {language === 'fr'
                      ? 'Coller le texte du contrat'
                      : 'Paste Contract Text'}
                  </span>
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-8 text-center transition-colors bg-gray-50/50 flex flex-col items-center justify-center space-y-3 cursor-pointer"
                  onClick={() => document.getElementById('contract-file-upload')?.click()}
                >
                  <input
                    id="contract-file-upload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedFile
                        ? selectedFile.name
                        : language === 'fr'
                        ? 'Cliquez pour sélectionner ou glissez-déposez votre contrat'
                        : 'Click to select or drag and drop your contract'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      PDF, JPG ou PNG (Conditions Générales, Bon de commande, Facture avec engagement)
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {language === 'fr' ? 'Fichier prêt' : 'File ready'} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    {language === 'fr'
                      ? 'Collez le texte brut du contrat ou des clauses :'
                      : 'Paste raw contract text or clauses:'}
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={
                      language === 'fr'
                        ? 'Ex: Contrat de téléphonie souscrit le 15/01/2023 pour une durée initiale de 24 mois. Préavis de 3 mois par LRAR...'
                        : 'Ex: Telecom agreement signed Jan 15, 2023 with 24 months initial term. 3 months notice...'
                    }
                    className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Action Button to trigger extraction */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExtracted(true);
                    setStep('verify');
                  }}
                  className="text-xs text-gray-500 hover:text-indigo-600 font-medium underline cursor-pointer"
                >
                  {language === 'fr'
                    ? 'Saisir manuellement sans extraction IA'
                    : 'Enter manually without AI extraction'}
                </button>

                <button
                  type="button"
                  disabled={isExtracting || (!selectedFile && !pastedText.trim())}
                  onClick={() => runAiExtraction()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {language === 'fr'
                          ? 'Extraction des clauses en cours...'
                          : 'Extracting clauses with AI...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>
                        {language === 'fr'
                          ? 'Analyser & Extraire avec IA'
                          : 'Analyze & Extract with AI'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Verification Form (Fields Extracted) */}
          {isExtracted && step === 'verify' && (
            <form id="form-save-contract" onSubmit={handleSaveWithoutLetter} className="space-y-6">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-900">
                    {language === 'fr'
                      ? 'Clauses et dates clés extraites'
                      : 'Extracted key clauses & dates'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsExtracted(false);
                    setSelectedFile(null);
                    setFileBase64(null);
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  {language === 'fr' ? 'Changer de document' : 'Change document'}
                </button>
              </div>

              {/* Section 1: Informations Générales */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  1. Informations Générales du Prestataire
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nom du fournisseur *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      placeholder="Ex: Orange Business, Canon France, AXA..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Numéro de contrat / Référence client
                    </label>
                    <input
                      type="text"
                      value={formData.contractNumber}
                      onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                      placeholder="Ex: CLI-89420 / CTR-2023"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Catégorie de dépense
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as ContractCategory,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Montant &amp; Fréquence
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-2/3 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                      <select
                        value={formData.paymentFrequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentFrequency: e.target.value as PaymentFrequency,
                          })
                        }
                        className="w-1/3 px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium"
                      >
                        <option value="mensuel">€ / mois</option>
                        <option value="annuel">€ / an</option>
                        <option value="trimestriel">€ / trim</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Dates & Échéances */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  2. Calendrier, Préavis &amp; Reconduction
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Début collaboration commerciale {isFrance && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    <input
                      type="date"
                      value={formData.relationshipStartDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          relationshipStartDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date d'échéance contractuelle *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-indigo-300 bg-indigo-50/30 font-bold text-indigo-900 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Délai de préavis requis (jours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.noticePeriodDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          noticePeriodDays: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      placeholder="Ex: 30, 60, 90"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Reconduction tacite automatique
                    </span>
                    <div className="text-[11px] text-gray-500">
                      Le contrat se renouvelle-t-il automatiquement sans dénonciation ?
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tacitRenewal}
                      onChange={(e) =>
                        setFormData({ ...formData, tacitRenewal: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Section 3: Contact de résiliation */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  3. Contact &amp; Coordonnées pour Résiliation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Destinataire / Service
                    </label>
                    <input
                      type="text"
                      value={formData.cancellationRecipient}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cancellationRecipient: e.target.value,
                        })
                      }
                      placeholder="Ex: Service Résiliation & Abonnements"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email de résiliation
                    </label>
                    <input
                      type="email"
                      value={formData.cancellationEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, cancellationEmail: e.target.value })
                      }
                      placeholder="Ex: resiliation@fournisseur.com"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Adresse postale complète (pour LRAR)
                    </label>
                    <input
                      type="text"
                      value={formData.cancellationAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, cancellationAddress: e.target.value })
                      }
                      placeholder="Ex: TSA 70014, 93736 Bobigny Cedex 9"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: Generated Letter Preview Screen */}
          {step === 'letter_preview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      {language === 'fr'
                        ? 'Lettre formelle rédigée avec succès'
                        : 'Formal termination letter generated'}
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      {language === 'fr'
                        ? `Prête pour ${formData.vendorName} • Échéance : ${formatDateFr(formData.endDate)}`
                        : `Ready for ${formData.vendorName} • Expiration: ${formatDateFr(formData.endDate)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyLetter}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedLetter ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'fr' ? 'Copié !' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'fr' ? 'Copier' : 'Copy'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 flex items-center space-x-1 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Letter Text Preview & Editor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {language === 'fr'
                    ? 'Contenu de la lettre formelle (modifiable) :'
                    : 'Letter text content (editable):'}
                </label>
                <textarea
                  rows={14}
                  value={generatedLetterText}
                  onChange={(e) => setGeneratedLetterText(e.target.value)}
                  className="w-full p-4 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-mono leading-relaxed bg-white shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200/80 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Action */}
          {step === 'letter_preview' ? (
            <button
              type="button"
              onClick={() => setStep('verify')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {language === 'fr' ? 'Modifier les champs' : 'Back to fields'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
          )}

          {/* Right Action Buttons */}
          {isExtracted && step === 'verify' && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
              {/* Secondary Action: Save without generating letter */}
              <button
                type="submit"
                form="form-save-contract"
                id="btn-save-contract-only"
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                {language === 'fr'
                  ? 'Enregistrer sans générer de lettre maintenant'
                  : 'Save without letter for now'}
              </button>

              {/* Primary Action: Generate Letter */}
              <button
                type="button"
                id="btn-generate-letter-flow"
                disabled={isGeneratingLetter}
                onClick={handleStartLetterGeneration}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingLetter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {language === 'fr'
                        ? 'Rédaction de la lettre...'
                        : 'Generating letter...'}
                    </span>
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 text-indigo-200" />
                    <span>
                      {language === 'fr'
                        ? 'Générer la lettre de résiliation'
                        : 'Generate Termination Letter'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* In Letter Preview: Save Both Contract and Letter */}
          {step === 'letter_preview' && (
            <button
              type="button"
              id="btn-save-contract-and-letter"
              onClick={handleSaveContractAndLetter}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-indigo-200" />
              <span>
                {language === 'fr'
                  ? 'Enregistrer le contrat et la lettre dans le tableau de bord'
                  : 'Save Contract & Letter to Dashboard'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
