import React, { useState } from 'react';
import {
  FileSignature,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  Building,
  AlertCircle,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GeneratedLetter, LetterStatus, ContractCategory } from '../types';
import { CATEGORY_CONFIG, formatDateFr } from '../utils/contractUtils';
import { useLanguage } from '../i18n/LanguageContext';

interface LetterHistoryProps {
  letters: GeneratedLetter[];
  onUpdateLetterStatus: (letterId: string, status: LetterStatus) => void;
  onDeleteLetter: (letterId: string) => void;
  onOpenAddModal: () => void;
  onNavigateToDashboard: () => void;
}

export const LetterHistory: React.FC<LetterHistoryProps> = ({
  letters,
  onUpdateLetterStatus,
  onDeleteLetter,
  onOpenAddModal,
  onNavigateToDashboard,
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LetterStatus>('all');
  const [selectedLetter, setSelectedLetter] = useState<GeneratedLetter | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter letters
  const filteredLetters = letters.filter((letter) => {
    const matchesSearch =
      letter.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (letter.contractNumber &&
        letter.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      letter.letterContent.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : letter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

    const safeVendor = letter.vendorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`Lettre_Resiliation_${safeVendor}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {language === 'fr'
                  ? 'Historique des lettres de résiliation'
                  : 'Termination Letters History'}
              </h1>
              <p className="text-xs text-gray-500">
                {language === 'fr'
                  ? 'Retrouvez, téléchargez et suivez l’envoi de toutes vos lettres formelles LRAR'
                  : 'Find, download and track delivery status for all formal cancellation letters'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {language === 'fr' ? 'Nouveau contrat / lettre' : 'New contract / letter'}
            </span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'fr'
                ? 'Rechercher un fournisseur, référence...'
                : 'Search vendor, ref...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-gray-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {language === 'fr' ? 'Toutes les lettres' : 'All Letters'} ({letters.length})
          </button>
          <button
            onClick={() => setStatusFilter('generated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'generated'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {language === 'fr' ? 'À envoyer' : 'Pending Send'} (
            {letters.filter((l) => l.status === 'generated').length})
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'sent'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {language === 'fr' ? 'Envoyées' : 'Sent'} (
            {letters.filter((l) => l.status === 'sent').length})
          </button>
        </div>
      </div>

      {/* Letters List / Grid */}
      {filteredLetters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-2xs flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <FileSignature className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {language === 'fr'
                ? 'Aucune lettre de résiliation trouvée'
                : 'No termination letters found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {language === 'fr'
                ? 'Générez votre première lettre de résiliation conforme à la loi directement lors de l’ajout d’un contrat ou depuis la liste de vos contrats.'
                : 'Generate your first legally compliant cancellation letter directly when adding a contract or from your contract list.'}
            </p>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {language === 'fr' ? 'Ajouter un contrat & Générer' : 'Add contract & Generate'}
              </span>
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              {language === 'fr' ? 'Voir le tableau de bord' : 'Go to dashboard'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLetters.map((letter) => {
            const categoryConfig = letter.category
              ? CATEGORY_CONFIG[letter.category]
              : null;
            const CategoryIcon = categoryConfig?.icon || Building;

            const isSent = letter.status === 'sent';

            return (
              <div
                key={letter.id}
                className="bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                {/* Header card */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {letter.vendorName}
                        </h3>
                        {letter.contractNumber && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            Ref: {letter.contractNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() =>
                        onUpdateLetterStatus(
                          letter.id,
                          isSent ? 'generated' : 'sent'
                        )
                      }
                      title={
                        language === 'fr'
                          ? 'Cliquer pour changer le statut'
                          : 'Click to toggle status'
                      }
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                        isSent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'fr' ? 'Envoyée' : 'Sent'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{language === 'fr' ? 'À envoyer' : 'Pending'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span>{language === 'fr' ? 'Générée le :' : 'Generated:'}</span>
                      <span className="font-medium text-gray-700">
                        {new Date(letter.generatedAt).toLocaleDateString(
                          language === 'fr' ? 'fr-FR' : 'en-US',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </span>
                    </div>

                    {isSent && letter.sentAt && (
                      <div className="flex items-center justify-between text-emerald-700 font-medium">
                        <span>{language === 'fr' ? 'Envoyée le :' : 'Sent on:'}</span>
                        <span>
                          {new Date(letter.sentAt).toLocaleDateString(
                            language === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Letter preview snippet */}
                  <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 font-mono line-clamp-3 leading-relaxed">
                    {letter.letterContent}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedLetter(letter)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title={language === 'fr' ? 'Voir le document complet' : 'View full letter'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopyText(letter.letterContent, letter.id)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title={language === 'fr' ? 'Copier le texte' : 'Copy text'}
                    >
                      {copiedId === letter.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(letter)}
                      className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title={language === 'fr' ? 'Télécharger en PDF' : 'Download as PDF'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        onUpdateLetterStatus(letter.id, isSent ? 'generated' : 'sent')
                      }
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                        isSent
                          ? 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        {isSent
                          ? language === 'fr'
                            ? 'Annuler envoi'
                            : 'Mark pending'
                          : language === 'fr'
                          ? 'Marquer envoyée'
                          : 'Mark sent'}
                      </span>
                    </button>

                    <button
                      onClick={() => onDeleteLetter(letter.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={language === 'fr' ? 'Supprimer de l’historique' : 'Delete letter'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Letter Modal Viewer */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedLetter.vendorName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? `Lettre générée le ${new Date(selectedLetter.generatedAt).toLocaleDateString('fr-FR')}`
                      : `Letter generated on ${new Date(selectedLetter.generatedAt).toLocaleDateString('en-US')}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLetter(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <textarea
                readOnly
                rows={16}
                value={selectedLetter.letterContent}
                className="w-full p-4 text-xs border border-gray-200 rounded-xl bg-gray-50/70 font-mono leading-relaxed focus:outline-none"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                {language === 'fr' ? 'Fermer' : 'Close'}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(selectedLetter.letterContent, selectedLetter.id)
                  }
                  className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedId === selectedLetter.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'fr' ? 'Copié !' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Copier texte' : 'Copy text'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedLetter)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
