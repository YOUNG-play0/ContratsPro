import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Contract, ContractCategory } from '../types';
import {
  formatCurrency,
  getAnnualEquivalent,
  getMonthlyEquivalent,
  isExpiringSoon,
  isNoticeDeadlineApproaching,
  CATEGORY_CONFIG,
} from '../utils/contractUtils';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardStatsProps {
  contracts: Contract[];
  onSelectCategoryFilter: (category: ContractCategory | 'all') => void;
  selectedCategory: ContractCategory | 'all';
  onNavigateToAlerts: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  contracts,
  onSelectCategoryFilter,
  selectedCategory,
  onNavigateToAlerts,
}) => {
  const { t, language } = useLanguage();

  const activeContracts = contracts.filter((c) => c.status !== 'cancelled');
  const watchContracts = contracts.filter((c) => c.status === 'watch');
  const cancelPendingContracts = contracts.filter((c) => c.status === 'cancel_pending');

  const expiringSoonList = contracts.filter((c) => isExpiringSoon(c));
  const noticeDeadlineSoonList = contracts.filter((c) => isNoticeDeadlineApproaching(c));

  const totalMonthlySpend = activeContracts.reduce(
    (acc, curr) => acc + getMonthlyEquivalent(curr.amount, curr.paymentFrequency),
    0
  );

  const totalAnnualSpend = activeContracts.reduce(
    (acc, curr) => acc + getAnnualEquivalent(curr.amount, curr.paymentFrequency),
    0
  );

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contracts */}
        <div
          id="stat-card-total"
          className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-gray-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.stats.activeContracts}
            </span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
            <span className="text-xs text-gray-500 font-medium">
              {activeContracts.length} {t.statuses.active.toLowerCase()}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {language === 'fr'
                ? `${watchContracts.length} à surveiller, ${cancelPendingContracts.length} en résiliation`
                : `${watchContracts.length} under review, ${cancelPendingContracts.length} cancelling`}
            </span>
          </div>
        </div>

        {/* Budget annuel engagé */}
        <div
          id="stat-card-spend"
          className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-gray-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.stats.annualBudget}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAnnualSpend)}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {language === 'fr' ? 'Soit ~ ' : 'Equivalent to ~ '}
            <span className="font-semibold text-gray-700">{formatCurrency(totalMonthlySpend)}</span>
            {language === 'fr' ? ' / mois' : ' / month'}
          </div>
        </div>

        {/* Alertes Échéances < 30j */}
        <div
          id="stat-card-expiring"
          onClick={onNavigateToAlerts}
          className={`rounded-xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer transition-all ${
            expiringSoonList.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
              : 'bg-white border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {language === 'fr' ? 'Échéance < 30 jours' : 'Expiring < 30 days'}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                expiringSoonList.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold ${
                expiringSoonList.length > 0 ? 'text-rose-700' : 'text-gray-900'
              }`}
            >
              {expiringSoonList.length}
            </div>
            {expiringSoonList.length > 0 && (
              <span className="text-xs font-medium text-rose-600 flex items-center">
                {language === 'fr' ? 'Action requise' : 'Action required'}{' '}
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {expiringSoonList.length > 0
              ? language === 'fr'
                ? 'Contrats arrivant à leur terme sous 30j'
                : 'Contracts reaching term in < 30 days'
              : language === 'fr'
              ? 'Aucun contrat en fin de terme immédiate'
              : 'No contracts reaching immediate term'}
          </div>
        </div>

        {/* Préavis & Tacite reconduction */}
        <div
          id="stat-card-notice"
          onClick={onNavigateToAlerts}
          className={`rounded-xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer transition-all ${
            noticeDeadlineSoonList.length > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
              : 'bg-white border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {language === 'fr' ? 'Préavis limite < 30 jours' : 'Notice Cut-off < 30 days'}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                noticeDeadlineSoonList.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold ${
                noticeDeadlineSoonList.length > 0 ? 'text-amber-800' : 'text-gray-900'
              }`}
            >
              {noticeDeadlineSoonList.length}
            </div>
            {noticeDeadlineSoonList.length > 0 && (
              <span className="text-xs font-medium text-amber-700 flex items-center">
                {language === 'fr' ? 'Délai critique' : 'Critical cut-off'}{' '}
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {language === 'fr'
              ? 'Risque de reconduction tacite automatique'
              : 'Auto-renewal lock-in risk'}
          </div>
        </div>
      </div>

      {/* Category Pills Filters */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>{t.stats.filterByCategory} :</span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              id="filter-category-all"
              onClick={() => onSelectCategoryFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.common.all} ({contracts.length})
            </button>

            {(Object.keys(CATEGORY_CONFIG) as ContractCategory[]).map((catKey) => {
              const catConfig = CATEGORY_CONFIG[catKey];
              const count = contracts.filter((c) => c.category === catKey).length;
              const isSelected = selectedCategory === catKey;
              const categoryLabel = t.categories[catKey] || catConfig.label;

              return (
                <button
                  key={catKey}
                  id={`filter-category-${catKey}`}
                  onClick={() => onSelectCategoryFilter(catKey)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : `${catConfig.bg} ${catConfig.border} hover:opacity-90`
                  }`}
                >
                  <span>{categoryLabel}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-gray-800 text-gray-200'
                        : 'bg-white/70 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
