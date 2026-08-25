import React, { useState } from 'react';
import {
  Search,
  Eye,
  FileSignature,
  Trash2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Radio,
  Shield,
  Cloud,
  Zap,
  Wrench,
  FileText,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Contract, ContractCategory, ContractStatus } from '../types';
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

interface ContractTableProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onGenerateLetter: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
  onOpenAddModal: () => void;
  selectedCategory: ContractCategory | 'all';
  onCategoryChange: (category: ContractCategory | 'all') => void;
  onUpdateStatus: (contractId: string, status: ContractStatus) => void;
}

type SortField = 'vendorName' | 'amount' | 'endDate' | 'noticePeriodDays' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onSelectContract,
  onGenerateLetter,
  onDeleteContract,
  onOpenAddModal,
  selectedCategory,
  onCategoryChange,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all' | 'expiring_30d'>('all');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filter logic
  const filteredContracts = contracts.filter((c) => {
    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.vendorName.toLowerCase().includes(q) ||
      (c.contractNumber && c.contractNumber.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      (c.summary && c.summary.toLowerCase().includes(q));

    // Category filter
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'expiring_30d') {
      matchesStatus = isExpiringSoon(c) || isNoticeDeadlineApproaching(c);
    } else if (statusFilter !== 'all') {
      matchesStatus = c.status === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort logic
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'vendorName':
        comparison = a.vendorName.localeCompare(b.vendorName);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'endDate':
        comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        break;
      case 'noticePeriodDays':
        comparison = a.noticePeriodDays - b.noticePeriodDays;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getCategoryIcon = (category: ContractCategory) => {
    switch (category) {
      case 'telecom':
        return <Radio className="w-3.5 h-3.5" />;
      case 'assurance':
        return <Shield className="w-3.5 h-3.5" />;
      case 'saas':
        return <Cloud className="w-3.5 h-3.5" />;
      case 'energie':
        return <Zap className="w-3.5 h-3.5" />;
      case 'maintenance':
        return <Wrench className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-gray-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gray-50/50">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-contracts"
            type="text"
            placeholder="Rechercher par fournisseur, référence, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Status Filters Tab group */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <button
            id="tab-status-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/60'
            }`}
          >
            Tous ({contracts.length})
          </button>
          <button
            id="tab-status-active"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/60'
            }`}
          >
            Actifs ({contracts.filter((c) => c.status === 'active').length})
          </button>
          <button
            id="tab-status-watch"
            onClick={() => setStatusFilter('watch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'watch'
                ? 'bg-amber-700 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/60'
            }`}
          >
            À surveiller ({contracts.filter((c) => c.status === 'watch').length})
          </button>
          <button
            id="tab-status-cancel-pending"
            onClick={() => setStatusFilter('cancel_pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'cancel_pending'
                ? 'bg-rose-700 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/60'
            }`}
          >
            À résilier ({contracts.filter((c) => c.status === 'cancel_pending').length})
          </button>
          <button
            id="tab-status-expiring-30d"
            onClick={() => setStatusFilter('expiring_30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              statusFilter === 'expiring_30d'
                ? 'bg-rose-900 text-white font-semibold shadow-xs ring-1 ring-rose-600'
                : 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Échéance &lt; 30j</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {/* 1. Fournisseur */}
              <th
                onClick={() => handleSort('vendorName')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Fournisseur</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* 2. Catégorie */}
              <th
                onClick={() => handleSort('category')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Catégorie</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* 3. Montant */}
              <th
                onClick={() => handleSort('amount')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Montant</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* 4. Fréquence */}
              <th className="py-3.5 px-4">
                <span>Fréquence</span>
              </th>

              {/* 5. Date d'échéance */}
              <th
                onClick={() => handleSort('endDate')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Date d'échéance</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* 6. Préavis de résiliation */}
              <th
                onClick={() => handleSort('noticePeriodDays')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Préavis</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* 7. Statut */}
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Statut</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 text-right">
                <span className="sr-only">Actions</span>
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {sortedContracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">Aucun contrat trouvé</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                        ? 'Essayez de modifier vos filtres ou termes de recherche.'
                        : 'Commencez par ajouter votre premier contrat fournisseur.'}
                    </p>
                    <button
                      onClick={onOpenAddModal}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Ajouter un contrat
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedContracts.map((contract) => {
                const daysUntilEnd = getDaysRemaining(contract.endDate);
                const expiringSoon = isExpiringSoon(contract);
                const noticeDeadline = getNoticeDeadlineDate(contract.endDate, contract.noticePeriodDays);
                const daysUntilNotice = getDaysRemaining(noticeDeadline);
                const noticeSoon = isNoticeDeadlineApproaching(contract);

                const categoryConfig = CATEGORY_CONFIG[contract.category] || CATEGORY_CONFIG.autre;
                const statusConfig = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;

                return (
                  <tr
                    key={contract.id}
                    id={`contract-row-${contract.id}`}
                    className={`hover:bg-gray-50/80 transition-colors group ${
                      expiringSoon ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* 1. Fournisseur */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-xs shrink-0 group-hover:bg-white group-hover:shadow-xs border border-gray-200/60 transition-all">
                          {contract.vendorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectContract(contract)}
                            className="font-medium text-gray-900 hover:text-indigo-600 text-left line-clamp-1 transition-colors"
                          >
                            {contract.vendorName}
                          </button>
                          <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-2">
                            <span>{contract.contractNumber || 'Réf. N/A'}</span>
                            {contract.tacitRenewal && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                                Tacite
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Catégorie */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${categoryConfig.bg} ${categoryConfig.border}`}
                      >
                        {getCategoryIcon(contract.category)}
                        <span>{categoryConfig.label}</span>
                      </span>
                    </td>

                    {/* 3. Montant */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(contract.amount, contract.currency)}
                      </div>
                      <div className="text-[11px] text-gray-400">HT / facturation</div>
                    </td>

                    {/* 4. Fréquence */}
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                        {FREQUENCY_LABELS[contract.paymentFrequency] || contract.paymentFrequency}
                      </span>
                    </td>

                    {/* 5. Date d'échéance + BADGE COLORÉ SI < 30 JOURS */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium text-gray-900 flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDateFr(contract.endDate)}</span>
                        </div>

                        {/* Visual colored badge if contract expires within 30 days */}
                        {expiringSoon ? (
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>
                              {daysUntilEnd <= 0
                                ? 'Échu !'
                                : `Échéance dans ${daysUntilEnd}j`}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400">
                            Dans {daysUntilEnd} jours
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. Préavis de résiliation */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col space-y-0.5">
                        <div className="text-xs font-semibold text-gray-800">
                          {contract.noticePeriodDays} jours
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Limite : {formatDateFr(noticeDeadline)}</span>
                        </div>
                        {noticeSoon && contract.status !== 'cancelled' && (
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                            Préavis sous {daysUntilNotice <= 0 ? '0' : daysUntilNotice}j
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Statut */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block text-left group/status">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeBg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotBg}`} />
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Detail Sheet button */}
                        <button
                          id={`btn-view-contract-${contract.id}`}
                          onClick={() => onSelectContract(contract)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="Consulter la fiche détaillée"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Generate Termination Letter CTA */}
                        <button
                          id={`btn-letter-contract-${contract.id}`}
                          onClick={() => onGenerateLetter(contract)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                          title="Générer une lettre de résiliation conforme"
                        >
                          <FileSignature className="w-4 h-4" />
                        </button>

                        {/* Delete Contract button */}
                        <button
                          id={`btn-delete-contract-${contract.id}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Supprimer définitivement le contrat de "${contract.vendorName}" ?`
                              )
                            ) {
                              onDeleteContract(contract.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer le contrat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-4 py-3 border-t border-gray-200/80 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
        <div>
          Affichage de <span className="font-semibold text-gray-700">{sortedContracts.length}</span> contrat(s)
          {selectedCategory !== 'all' && ` dans "${CATEGORY_CONFIG[selectedCategory]?.label}"`}
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Badge rouge = Échéance &lt; 30 jours</span>
          </span>
        </div>
      </div>
    </div>
  );
};
