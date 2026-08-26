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
} from 'lucide-react';
import { CompanyProfile, Contract, ContractCategory, ContractStatus, PaymentFrequency } from '../types';
import { CATEGORY_CONFIG } from '../utils/contractUtils';
import { calculateRelationshipDurationMonths, isRelationOver24Months } from '../utils/countryUtils';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContract: (newContract: Contract) => void;
  companyProfile?: CompanyProfile;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({
  isOpen,
  onClose,
  onSaveContract,
  companyProfile,
}) => {
  const isFrance = (companyProfile?.country || 'FR').toUpperCase() === 'FR';
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracted, setIsExtracted] = useState(false);

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
        throw new Error('Veuillez sélectionner un fichier ou renseigner le texte du contrat.');
      }

      const res = await fetch('/api/extract-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'extraction par l'IA.");
      }

      const ext = data.data || data;

      // Populate form with extracted data
      setFormData({
        vendorName: ext.vendorName || '',
        contractNumber: ext.contractNumber || '',
        category: (ext.category as ContractCategory) || 'autre',
        amount: Number(ext.amount) || 0,
        currency: ext.currency || 'EUR',
        paymentFrequency: (ext.paymentFrequency as PaymentFrequency) || 'mensuel',
        signatureDate: ext.signatureDate || new Date().toISOString().split('T')[0],
        startDate: ext.startDate || ext.signatureDate || new Date().toISOString().split('T')[0],
        relationshipStartDate: ext.relationshipStartDate || ext.startDate || ext.signatureDate || new Date().toISOString().split('T')[0],
        commitmentDurationMonths: Number(ext.commitmentDurationMonths) || 12,
        endDate: ext.endDate || '',
        noticePeriodDays: Number(ext.noticePeriodDays) || 30,
        tacitRenewal: ext.tacitRenewal !== undefined ? Boolean(ext.tacitRenewal) : true,
        cancellationRecipient: ext.cancellationContact?.recipientName || 'Service Résiliation',
        cancellationAddress: ext.cancellationContact?.address || '',
        cancellationEmail: ext.cancellationContact?.email || '',
        cancellationPhone: ext.cancellationContact?.phone || '',
        keyClauses: Array.isArray(ext.keyClauses) ? ext.keyClauses : [],
        summary: ext.summary || '',
        status: (ext.suggestedStatus as ContractStatus) || 'active',
        notes: '',
      });

      setIsExtracted(true);
    } catch (err: any) {
      console.error(err);
      setExtractionError(err.message || "Erreur lors de l'extraction des données.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit and Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorName.trim()) {
      setExtractionError('Le nom du fournisseur est obligatoire.');
      return;
    }

    if (!formData.endDate) {
      setExtractionError("La date d'échéance est obligatoire.");
      return;
    }

    if (isFrance && !formData.relationshipStartDate) {
      setExtractionError("La date de début de relation commerciale est obligatoire en France (évaluation de l'article L. 442-1 du Code de commerce).");
      return;
    }

    const newContract: Contract = {
      id: `ctr-${Date.now()}`,
      vendorName: formData.vendorName.trim(),
      contractNumber: formData.contractNumber.trim() || undefined,
      category: formData.category,
      amount: Number(formData.amount) || 0,
      currency: formData.currency || 'EUR',
      paymentFrequency: formData.paymentFrequency,
      signatureDate: formData.signatureDate || undefined,
      startDate: formData.startDate || undefined,
      relationshipStartDate: isFrance ? (formData.relationshipStartDate || undefined) : (formData.relationshipStartDate || undefined),
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
      attachedFileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} Mo` : undefined,
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

    onSaveContract(newContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/80 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xs">
              <FileUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Ajouter un nouveau contrat fournisseur
              </h2>
              <p className="text-xs text-gray-500">
                Extraction automatique par IA ou saisie manuelle
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

        {/* Modal Body with scrolling */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Method Selector Tabs if not extracted yet */}
          {!isExtracted && (
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === 'upload'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Fichier ou Texte (Analyse IA)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setIsExtracted(true);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === 'manual'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Saisie 100% Manuelle</span>
              </button>
            </div>
          )}

          {/* TAB 1: File Upload / Drag & Drop */}
          {!isExtracted && activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-all cursor-pointer relative"
              >
                <input
                  type="file"
                  id="file-upload-input"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  Glissez-déposez votre contrat ici
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés : PDF, PNG, JPG, JPEG ou texte (max 20 Mo)
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 shadow-xs">
                    Parcourir les fichiers
                  </span>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-indigo-950 truncate max-w-sm">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        {(selectedFile.size / 1024).toFixed(0)} Ko
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => runAiExtraction()}
                    disabled={isExtracting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyse IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extraire les données via IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Paste raw text alternative */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ou collez directement le texte du contrat ci-dessous :
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Copiez-collez ici le texte des clauses ou conditions particulières de votre contrat..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
                {pastedText.trim().length > 20 && !selectedFile && (
                  <button
                    type="button"
                    onClick={() => runAiExtraction()}
                    disabled={isExtracting}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center space-x-1.5"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraction IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Analyser le texte avec l'IA</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* AI Processing Banner */}
          {isExtracting && (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-gray-900">
                Extraction intelligente des données contractuelles...
              </div>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                L'IA analyse le fournisseur, le montant, la périodicité, le préavis légal,
                la tacite reconduction et les contacts de résiliation.
              </p>
            </div>
          )}

          {/* Error Message */}
          {extractionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{extractionError}</span>
            </div>
          )}

          {/* EDITABLE FORM (Step 3: Verification & Modification before save) */}
          {isExtracted && (
            <form id="form-save-contract" onSubmit={handleSave} className="space-y-6">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    Données extraites par l'IA. Vérifiez et ajustez les champs avant
                    l'enregistrement :
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExtracted(false)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
                >
                  Réessayer avec un autre fichier
                </button>
              </div>

              {/* Section 1: Informations Générales */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  1. Identification du Fournisseur &amp; Catégorie
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Fournisseur */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nom du Fournisseur / Prestataire *
                    </label>
                    <input
                      id="input-vendor-name"
                      type="text"
                      required
                      value={formData.vendorName}
                      onChange={(e) =>
                        setFormData({ ...formData, vendorName: e.target.value })
                      }
                      placeholder="Ex: Orange Business Services, Alan, HubSpot..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Numéro de contrat */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      N° / Réf. Contrat
                    </label>
                    <input
                      id="input-contract-number"
                      type="text"
                      value={formData.contractNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, contractNumber: e.target.value })
                      }
                      placeholder="Ex: B2B-2025-001"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      id="select-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as ContractCategory,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    >
                      {Object.keys(CATEGORY_CONFIG).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat as ContractCategory].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Montant */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Montant (€ HT ou TTC) *
                    </label>
                    <div className="relative">
                      <input
                        id="input-amount"
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 pr-8 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none font-semibold text-gray-900"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                        €
                      </span>
                    </div>
                  </div>

                  {/* Fréquence de paiement */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fréquence de paiement *
                    </label>
                    <select
                      id="select-frequency"
                      value={formData.paymentFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentFrequency: e.target.value as PaymentFrequency,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="mensuel">Mensuel</option>
                      <option value="trimestriel">Trimestriel</option>
                      <option value="annuel">Annuel</option>
                      <option value="ponctuel">Ponctuel</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Dates, Durée, Préavis & Tacite reconduction */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  2. Calendrier, Échéance &amp; Conditions de Résiliation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Date d'échéance */}
                  <div>
                    <label className="block text-xs font-semibold text-rose-700 mb-1">
                      Date d'échéance finale *
                    </label>
                    <input
                      id="input-end-date"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-rose-300 bg-rose-50/30 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold"
                    />
                  </div>

                  {/* Préavis de résiliation en jours */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Préavis de résiliation (jours) *
                    </label>
                    <input
                      id="input-notice-days"
                      type="number"
                      min={0}
                      max={365}
                      required
                      value={formData.noticePeriodDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          noticePeriodDays: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 30, 60, 90"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Date de signature */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date de signature
                    </label>
                    <input
                      id="input-signature-date"
                      type="date"
                      value={formData.signatureDate}
                      onChange={(e) =>
                        setFormData({ ...formData, signatureDate: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Durée d'engagement (mois) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Engagement (mois)
                    </label>
                    <input
                      id="input-commitment-months"
                      type="number"
                      min={0}
                      value={formData.commitmentDurationMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commitmentDurationMonths: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 12, 24, 36"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* CHAMP OBLIGATOIRE POUR LA FRANCE : Date de début de relation commerciale (L. 442-1) */}
                {isFrance && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label htmlFor="input-relationship-start-date" className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-700" />
                        <span>Date de début de la relation commerciale (France) *</span>
                      </label>
                      {formData.relationshipStartDate && (
                        <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                          Ancienneté : {calculateRelationshipDurationMonths(formData.relationshipStartDate)} mois
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="sm:col-span-1">
                        <input
                          id="input-relationship-start-date"
                          type="date"
                          required={isFrance}
                          value={formData.relationshipStartDate}
                          onChange={(e) =>
                            setFormData({ ...formData, relationshipStartDate: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-gray-900"
                        />
                      </div>
                      <div className="sm:col-span-2 text-[11px] text-blue-800 leading-relaxed">
                        Date initiale de votre premier contrat ou commande avec ce fournisseur (peut être antérieure au contrat actuel). Indispensable pour évaluer le risque de rupture brutale (art. L. 442-1 Code de commerce).
                      </div>
                    </div>
                    {formData.relationshipStartDate && calculateRelationshipDurationMonths(formData.relationshipStartDate) >= 24 && (
                      <div className="mt-1 p-2 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-lg text-[11px] flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          <strong>Attention (Art. L. 442-1 II C. com.) :</strong> Relation établie depuis plus de 24 mois ({calculateRelationshipDurationMonths(formData.relationshipStartDate)} mois). L'IA adaptera le préavis et formulera des réserves pour prévenir tout grief de rupture brutale.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reconduction tacite Checkbox */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-800">
                      Reconduction tacite automatique
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Le contrat se renouvelle-t-il automatiquement sans dénonciation ?
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-tacit-renewal"
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
                      Adresse postale complète (pour envoi LRAR)
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

              {/* Section 4: Statut & Synthèse */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                  4. Statut &amp; Notes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Statut initial
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as ContractStatus,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium"
                    >
                      <option value="active">Actif (en cours de validité)</option>
                      <option value="watch">À surveiller (décision proche)</option>
                      <option value="cancel_pending">À résilier (action requise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Notes internes
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Ex: Demander devis concurrent avant le 15..."
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200/80 bg-gray-50/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>

          {isExtracted && (
            <button
              type="submit"
              form="form-save-contract"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-600"
            >
              Enregistrer le contrat dans le tableau de bord
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
