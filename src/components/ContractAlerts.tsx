import React from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  FileSignature,
  Eye,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  BellRing,
  AlertCircle,
} from 'lucide-react';
import { Contract } from '../types';
import {
  formatCurrency,
  formatDateFr,
  getDaysRemaining,
  getNoticeDeadlineDate,
  isExpiringSoon,
  isNoticeDeadlineApproaching,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
} from '../utils/contractUtils';

interface ContractAlertsProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onGenerateLetter: (contract: Contract) => void;
  onBackToDashboard: () => void;
}

export const ContractAlerts: React.FC<ContractAlertsProps> = ({
  contracts,
  onSelectContract,
  onGenerateLetter,
  onBackToDashboard,
}) => {
  // Contrats dont l'échéance arrive sous 30 jours
  const expiringContracts = contracts.filter((c) => isExpiringSoon(c));

  // Contrats dont le préavis arrive sous 30 jours (ou dépassé)
  const noticeDeadlineContracts = contracts.filter((c) => isNoticeDeadlineApproaching(c));

  // Unique combined list of contracts with any alert < 30 days
  const allAlertContractIds = new Set([
    ...expiringContracts.map((c) => c.id),
    ...noticeDeadlineContracts.map((c) => c.id),
  ]);

  const allAlertContracts = contracts.filter((c) => allAlertContractIds.has(c.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-800">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BellRing className="w-4 h-4" />
            <span>Surveillance des échéances &amp; préavis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Contrats fournisseurs nécessitant une décision (&lt; 30 jours)
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Cette section surveille en temps réel les dates d'échéance et les délais limites
            d'envoi de préavis pour éviter toute reconduction tacite involontaire.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="self-start md:self-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition-colors whitespace-nowrap"
        >
          Retour au tableau de bord
        </button>
      </div>

      {allAlertContracts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Aucun contrat n'arrive à échéance sous 30 jours
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
            Tous vos contrats fournisseurs sont sous contrôle. Vous recevrez une alerte
            automatique dès qu'une date de préavis ou d'échéance entrera dans la fenêtre des 30
            jours.
          </p>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Consulter tous les contrats
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-rose-900">
                  {expiringContracts.length} contrat(s)
                </div>
                <div className="text-xs text-rose-700 font-medium">
                  Échéance contractuelle finale &lt; 30 jours
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-amber-900">
                  {noticeDeadlineContracts.length} contrat(s)
                </div>
                <div className="text-xs text-amber-800 font-medium">
                  Date limite d'envoi de préavis &lt; 30 jours (risque tacite reconduction)
                </div>
              </div>
            </div>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-4">
            {allAlertContracts.map((contract) => {
              const daysToEnd = getDaysRemaining(contract.endDate);
              const noticeDate = getNoticeDeadlineDate(
                contract.endDate,
                contract.noticePeriodDays
              );
              const daysToNotice = getDaysRemaining(noticeDate);

              const categoryConfig =
                CATEGORY_CONFIG[contract.category] || CATEGORY_CONFIG.autre;
              const statusConfig =
                STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;

              return (
                <div
                  key={contract.id}
                  id={`alert-card-${contract.id}`}
                  className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-gray-300 relative overflow-hidden"
                >
                  {/* Top color indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      daysToEnd <= 15 || daysToNotice <= 10
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Vendor & Category */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">
                          {contract.vendorName}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${categoryConfig.bg} ${categoryConfig.border}`}
                        >
                          {categoryConfig.label}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusConfig.badgeBg}`}
                        >
                          {statusConfig.label}
                        </span>
                        {contract.tacitRenewal && (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Reconduction tacite active
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Réf : {contract.contractNumber || 'Non renseigné'}</span>
                        <span>
                          Montant :{' '}
                          <strong className="text-gray-700">
                            {formatCurrency(contract.amount, contract.currency)}
                          </strong>{' '}
                          ({contract.paymentFrequency})
                        </span>
                        {contract.cancellationContact?.address && (
                          <span className="truncate max-w-xs">
                            Adresse résiliation : {contract.cancellationContact.address}
                          </span>
                        )}
                      </div>

                      {contract.summary && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                          "{contract.summary}"
                        </p>
                      )}
                    </div>

                    {/* Middle Column: Deadlines & Countdown */}
                    <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shrink-0">
                      {/* Expiration date */}
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Échéance finale
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatDateFr(contract.endDate)}
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            daysToEnd <= 0
                              ? 'text-rose-700 font-bold'
                              : daysToEnd <= 30
                              ? 'text-rose-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {daysToEnd <= 0
                            ? 'Échu aujourd’hui !'
                            : `Dans ${daysToEnd} jour(s)`}
                        </div>
                      </div>

                      <div className="h-8 w-px bg-gray-200" />

                      {/* Notice deadline */}
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Délai préavis ({contract.noticePeriodDays}j)
                        </div>
                        <div className="text-sm font-bold text-amber-900">
                          {formatDateFr(noticeDate)}
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            daysToNotice <= 0
                              ? 'text-rose-700 font-bold'
                              : daysToNotice <= 30
                              ? 'text-amber-700'
                              : 'text-gray-500'
                          }`}
                        >
                          {daysToNotice <= 0
                            ? 'Préavis dépassé !'
                            : `Reste ${daysToNotice} jour(s)`}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: CTAs */}
                    <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => onSelectContract(contract)}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors flex items-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>Fiche détail</span>
                      </button>

                      <button
                        onClick={() => onGenerateLetter(contract)}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <FileSignature className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Générer lettre de résiliation</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
