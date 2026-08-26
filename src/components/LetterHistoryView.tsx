import React, { useState } from 'react';
import {
  FileSignature,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  Eye,
  Trash2,
  MailCheck,
  Building,
  Send,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  FileText,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GeneratedLetter, LetterStatus, ContractCategory } from '../types';
import { formatDateFr, CATEGORY_CONFIG } from '../utils/contractUtils';
import { useLanguage } from '../i18n/LanguageContext';

interface LetterHistoryViewProps {
  letters: GeneratedLetter[];
  onToggleStatus: (letterId: string) => void;
  onDeleteLetter: (letterId: string) => void;
  onNavigateToContracts: () => void;
}

export const LetterHistoryView: React.FC<LetterHistoryViewProps> = ({
  letters,
  onToggleStatus,
  onDeleteLetter,
  onNavigateToContracts,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LetterStatus | 'all'>('all');
  const [selectedLetterForView, setSelectedLetterForView] = useState<GeneratedLetter | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter letters
  const filteredLetters = letters.filter((letter) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      letter.vendorName.toLowerCase().includes(q) ||
      (letter.contractNumber && letter.contractNumber.toLowerCase().includes(q)) ||
      (letter.reason && letter.reason.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const generatedCount = letters.filter((l) => l.status === 'generated').length;
  const sentCount = letters.filter((l) => l.status === 'sent').length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPDF = (letter: GeneratedLetter) => {
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

    const lines = doc.splitTextToSize(letter.letterContent, maxLineWidth);

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

    const safeVendor = (letter.vendorName || 'fournisseur')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    doc.save(`Lettre_Resiliation_${safeVendor}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileSignature className="w-4 h-4" />
            <span>
              {language === 'fr'
                ? 'Registre & Suivi des démarches'
                : 'Termination Notices Register'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {language === 'fr'
              ? 'Historique des lettres de résiliation'
              : 'Termination Letters History'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            {language === 'fr'
              ? 'Consultez, téléchargez en PDF et suivez le statut d’envoi de tous vos courriers formels générés.'
              : 'View, download PDFs, and track delivery status for all formal generated termination letters.'}
          </p>
        </div>

        <button
          onClick={onNavigateToContracts}
          className="self-start md:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap flex items-center space-x-1.5 cursor-pointer"
        >
          <span>{language === 'fr' ? 'Gérer les contrats' : 'Manage contracts'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {language === 'fr' ? 'Total lettres générées' : 'Total Generated Letters'}
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{letters.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {language === 'fr' ? 'Courriers formels archivés' : 'Archived notice letters'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] bg-emerald-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            {language === 'fr' ? 'Courriers envoyés' : 'Notices Sent'}
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{sentCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">
            {language === 'fr' ? 'Démarche notifiée au prestataire' : 'Notified to provider'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] bg-amber-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            {language === 'fr' ? 'En attente d’envoi' : 'Pending Delivery'}
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{generatedCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">
            {language === 'fr' ? 'Prêtes pour envoi LRAR' : 'Ready for registered mail'}
          </div>
        </div>
      </div>

      {/* Main Table / List Container */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Search & Filter Header Bar */}
        <div className="p-4 border-b border-gray-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gray-50/50">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-letters"
              type="text"
              placeholder={
                language === 'fr'
                  ? 'Rechercher par fournisseur, référence...'
                  : 'Search by vendor, reference...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {language === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              {language === 'fr' ? 'Toutes' : 'All'} ({letters.length})
            </button>

            <button
              onClick={() => setStatusFilter('generated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'generated'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              {language === 'fr' ? 'En attente' : 'Pending'} ({generatedCount})
            </button>

            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'sent'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              {language === 'fr' ? 'Envoyées' : 'Sent'} ({sentCount})
            </button>
          </div>
        </div>

        {/* Letters List */}
        {filteredLetters.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <div className="max-w-sm mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-100">
                <FileSignature className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {language === 'fr'
                  ? 'Aucune lettre de résiliation dans l’historique'
                  : 'No termination letters in history'}
              </p>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                {language === 'fr'
                  ? 'Générez des lettres de résiliation formelles depuis l’ajout de contrat ou le tableau de bord pour les retrouver ici.'
                  : 'Generate formal termination notices from contract creation or dashboard to access them here.'}
              </p>
              <button
                onClick={onNavigateToContracts}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {language === 'fr' ? 'Aller aux contrats' : 'Go to contracts'}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLetters.map((letter) => {
              const isSent = letter.status === 'sent';
              const catConfig = letter.category ? CATEGORY_CONFIG[letter.category] : null;

              return (
                <div
                  key={letter.id}
                  id={`letter-row-${letter.id}`}
                  className="p-4 sm:p-5 hover:bg-gray-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {letter.vendorName.substring(0, 2).toUpperCase()}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        {letter.vendorName}
                      </h4>

                      {catConfig && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${catConfig.bg} ${catConfig.border}`}
                        >
                          {catConfig.label}
                        </span>
                      )}

                      {/* Status Toggle Button / Pill */}
                      <button
                        onClick={() => onToggleStatus(letter.id)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSent
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                        title={
                          language === 'fr'
                            ? 'Cliquez pour basculer le statut'
                            : 'Click to toggle status'
                        }
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'fr' ? 'Envoyée' : 'Sent'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {language === 'fr' ? 'En attente d’envoi' : 'Pending send'}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] opacity-70 underline ml-1">
                          ({language === 'fr' ? 'changer' : 'change'})
                        </span>
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        {language === 'fr' ? 'Générée le :' : 'Generated:'}{' '}
                        <strong className="text-gray-700">{formatDateFr(letter.generatedAt)}</strong>
                      </span>
                      {letter.contractNumber && (
                        <span>
                          {language === 'fr' ? 'Réf contrat :' : 'Ref:'}{' '}
                          <span className="font-mono text-gray-700">{letter.contractNumber}</span>
                        </span>
                      )}
                      {letter.sentAt && isSent && (
                        <span className="text-emerald-700 font-medium">
                          {language === 'fr' ? 'Notifiée le :' : 'Sent on:'}{' '}
                          {formatDateFr(letter.sentAt)}
                        </span>
                      )}
                    </div>

                    {letter.reason && (
                      <p className="text-xs text-gray-600 line-clamp-1 italic bg-gray-50 p-1.5 rounded border border-gray-100">
                        {letter.reason}
                      </p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                    {/* View full text */}
                    <button
                      onClick={() => setSelectedLetterForView(letter)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      <span>{language === 'fr' ? 'Revoir' : 'View'}</span>
                    </button>

                    {/* Copy text */}
                    <button
                      onClick={() => handleCopy(letter.letterContent, letter.id)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title={language === 'fr' ? 'Copier le texte' : 'Copy text'}
                    >
                      {copiedId === letter.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">
                            {language === 'fr' ? 'Copié' : 'Copied'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>{language === 'fr' ? 'Copier' : 'Copy'}</span>
                        </>
                      )}
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadPDF(letter)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title={language === 'fr' ? 'Télécharger le PDF' : 'Download PDF'}
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>PDF</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            language === 'fr'
                              ? `Supprimer cette lettre de résiliation pour "${letter.vendorName}" de l'historique ?`
                              : `Remove this termination letter for "${letter.vendorName}" from history?`
                          )
                        ) {
                          onDeleteLetter(letter.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={language === 'fr' ? 'Supprimer de l’historique' : 'Delete from history'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal View Full Letter Preview */}
      {selectedLetterForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <FileSignature className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'fr' ? 'Lettre de résiliation :' : 'Termination Letter:'}{' '}
                    {selectedLetterForView.vendorName}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'fr' ? 'Générée le' : 'Generated on'}{' '}
                  {formatDateFr(selectedLetterForView.generatedAt)}
                  {selectedLetterForView.contractNumber &&
                    ` • Réf: ${selectedLetterForView.contractNumber}`}
                </p>
              </div>

              <button
                onClick={() => setSelectedLetterForView(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Letter Content preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/40">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap selection:bg-indigo-100">
                {selectedLetterForView.letterContent}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              {/* Toggle Status in Modal */}
              <button
                onClick={() => {
                  onToggleStatus(selectedLetterForView.id);
                  setSelectedLetterForView({
                    ...selectedLetterForView,
                    status: selectedLetterForView.status === 'sent' ? 'generated' : 'sent',
                    sentAt:
                      selectedLetterForView.status !== 'sent'
                        ? new Date().toISOString()
                        : undefined,
                  });
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  selectedLetterForView.status === 'sent'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {selectedLetterForView.status === 'sent' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {language === 'fr' ? 'Marquée comme Envoyée' : 'Marked as Sent'}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {language === 'fr'
                        ? 'Marquer comme Envoyée'
                        : 'Mark as Sent'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleCopy(
                      selectedLetterForView.letterContent,
                      `modal-${selectedLetterForView.id}`
                    )
                  }
                  className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === `modal-${selectedLetterForView.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">
                        {language === 'fr' ? 'Copié !' : 'Copied!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>{language === 'fr' ? 'Copier le texte' : 'Copy text'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadPDF(selectedLetterForView)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Télécharger PDF' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
