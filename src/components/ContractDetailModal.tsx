import React, { useState } from 'react';
import {
  X,
  FileSignature,
  Calendar,
  Clock,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  History,
  Shield,
  Tag,
  ArrowRight,
  Download,
  Copy,
  Edit2,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Contract, ContractStatus } from '../types';
import {
  formatCurrency,
  formatDateFr,
  getDaysRemaining,
  getNoticeDeadlineDate,
  isExpiringSoon,
  isNoticeDeadlineApproaching,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  FREQUENCY_LABELS,
} from '../utils/contractUtils';

interface ContractDetailModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateLetter: (contract: Contract) => void;
  onUpdateStatus: (contractId: string, status: ContractStatus) => void;
  onUpdateNotes: (contractId: string, notes: string) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  isOpen,
  onClose,
  onGenerateLetter,
  onUpdateStatus,
  onUpdateNotes,
}) => {
  if (!isOpen || !contract) return null;

  const [notesText, setNotesText] = useState(contract.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const daysUntilEnd = getDaysRemaining(contract.endDate);
  const expiringSoon = isExpiringSoon(contract);
  const noticeDeadline = getNoticeDeadlineDate(contract.endDate, contract.noticePeriodDays);
  const daysUntilNotice = getDaysRemaining(noticeDeadline);
  const noticeSoon = isNoticeDeadlineApproaching(contract);

  const categoryConfig = CATEGORY_CONFIG[contract.category] || CATEGORY_CONFIG.autre;
  const statusConfig = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;

  const handleSaveNotes = () => {
    onUpdateNotes(contract.id, notesText);
    setIsEditingNotes(false);
  };

  const copyAddress = () => {
    if (contract.cancellationContact?.address) {
      navigator.clipboard.writeText(contract.cancellationContact.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/80 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
              {contract.vendorName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {contract.vendorName}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${categoryConfig.bg} ${categoryConfig.border}`}
                >
                  {categoryConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                Réf. : {contract.contractNumber || 'Non spécifié'} • ID : {contract.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Key Figures & Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Montant contractuel
              </span>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(contract.amount, contract.currency)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Facturation {FREQUENCY_LABELS[contract.paymentFrequency]}
              </div>
            </div>

            {/* End Date & Countdown */}
            <div
              className={`p-4 rounded-xl border ${
                expiringSoon
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-gray-50 border-gray-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Date d'échéance
                </span>
                {expiringSoon && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-200 text-rose-800 rounded">
                    &lt; 30j
                  </span>
                )}
              </div>
              <div
                className={`text-xl font-bold mt-1 ${
                  expiringSoon ? 'text-rose-700' : 'text-gray-900'
                }`}
              >
                {formatDateFr(contract.endDate)}
              </div>
              <div
                className={`text-xs mt-0.5 font-medium ${
                  daysUntilEnd <= 0
                    ? 'text-rose-700 font-bold'
                    : expiringSoon
                    ? 'text-rose-600'
                    : 'text-gray-500'
                }`}
              >
                {daysUntilEnd <= 0
                  ? 'Échu à ce jour'
                  : `Dans ${daysUntilEnd} jours`}
              </div>
            </div>

            {/* Status Selector */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Statut du contrat
              </span>
              <div className="mt-1">
                <select
                  value={contract.status}
                  onChange={(e) =>
                    onUpdateStatus(contract.id, e.target.value as ContractStatus)
                  }
                  className={`w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg border focus:ring-2 focus:ring-indigo-600 focus:outline-none ${statusConfig.badgeBg}`}
                >
                  <option value="active">Actif</option>
                  <option value="watch">À surveiller</option>
                  <option value="cancel_pending">À résilier</option>
                  <option value="cancelled">Résilié</option>
                </select>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {contract.tacitRenewal ? 'Reconduction tacite : Oui' : 'Reconduction : Non'}
              </div>
            </div>
          </div>

          {/* Notice & Legal Timeline Alert Banner */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Délai de préavis contractuel : {contract.noticePeriodDays} jours
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Date limite impérative d'expédition du préavis :{' '}
                  <strong>{formatDateFr(noticeDeadline)}</strong>{' '}
                  {daysUntilNotice <= 30 && (
                    <span className="text-rose-700 font-bold">
                      (Il reste {daysUntilNotice} jours pour envoyer la lettre LRAR !)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Direct CTA Generate letter */}
            <button
              onClick={() => onGenerateLetter(contract)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <FileSignature className="w-4 h-4 text-indigo-200" />
              <span>Générer la lettre de résiliation</span>
            </button>
          </div>

          {/* Details Tabs / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Contract Characteristics */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                Modalités Contractuelles
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Date de signature :</span>
                  <span className="font-medium text-gray-800">
                    {formatDateFr(contract.signatureDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Date de début d'effet :</span>
                  <span className="font-medium text-gray-800">
                    {formatDateFr(contract.startDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Durée d'engagement :</span>
                  <span className="font-medium text-gray-800">
                    {contract.commitmentDurationMonths
                      ? `${contract.commitmentDurationMonths} mois`
                      : 'Non spécifié'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Reconduction tacite :</span>
                  <span className="font-semibold text-gray-800">
                    {contract.tacitRenewal ? 'Oui (Annuelle/Périodique)' : 'Non (Terme ferme)'}
                  </span>
                </div>
                {contract.attachedFileName && (
                  <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                    <span className="text-gray-500">Fichier associé :</span>
                    <span className="font-medium text-indigo-600 flex items-center space-x-1 truncate max-w-[180px]">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{contract.attachedFileName}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Key Clauses */}
              {contract.keyClauses && contract.keyClauses.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                    Clauses clés identifiées :
                  </h4>
                  <ul className="space-y-1">
                    {contract.keyClauses.map((clause, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start space-x-2"
                      >
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{clause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Cancellation Contact & Notes */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
                Contact &amp; Adresse pour Résilier
              </h3>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2 text-xs">
                {contract.cancellationContact?.recipientName && (
                  <div className="font-semibold text-gray-800">
                    {contract.cancellationContact.recipientName}
                  </div>
                )}

                {contract.cancellationContact?.address && (
                  <div className="flex items-start justify-between text-gray-600">
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{contract.cancellationContact.address}</span>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 ml-2 shrink-0 flex items-center space-x-1"
                      title="Copier l'adresse"
                    >
                      {copiedAddress ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedAddress ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                )}

                {contract.cancellationContact?.email && (
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <a
                      href={`mailto:${contract.cancellationContact.email}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {contract.cancellationContact.email}
                    </a>
                  </div>
                )}

                {contract.cancellationContact?.phone && (
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{contract.cancellationContact.phone}</span>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-gray-700">Notes internes</h4>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Ajouter des consignes, négociations en cours..."
                      className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 min-h-[50px]">
                    {contract.notes || 'Aucune note interne saisie pour le moment.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action History */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Historique des actions</span>
            </h3>

            <div className="space-y-2">
              {contract.actions && contract.actions.length > 0 ? (
                contract.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-200/60 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-gray-800 font-medium">{act.description}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {formatDateFr(act.date)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 italic">
                  Aucune action enregistrée.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/80 bg-gray-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>

          <button
            onClick={() => onGenerateLetter(contract)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-2"
          >
            <FileSignature className="w-4 h-4 text-indigo-200" />
            <span>Rédiger lettre de résiliation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
