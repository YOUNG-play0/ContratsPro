import React from 'react';
import {
  FileText,
  Plus,
  Bell,
  Building2,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { CompanyProfile } from '../types';

interface NavbarProps {
  companyProfile: CompanyProfile;
  alertCount: number;
  activeView: 'dashboard' | 'alerts';
  setActiveView: (view: 'dashboard' | 'alerts') => void;
  onOpenAddModal: () => void;
  onOpenCompanyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyProfile,
  alertCount,
  activeView,
  setActiveView,
  onOpenAddModal,
  onOpenCompanyModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center space-x-6">
            <div
              id="brand-logo-container"
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveView('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xs">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
                    ContratsPro
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded border border-gray-200">
                    B2B
                  </span>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Gestion des contrats fournisseurs PME/TPE
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-gray-200">
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Tableau de bord
              </button>
              <button
                id="nav-tab-alerts"
                onClick={() => setActiveView('alerts')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeView === 'alerts'
                    ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200/60'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>Alertes échéances</span>
                {alertCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-600 rounded-full">
                    {alertCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-3">
            {/* Alert Bell Button for mobile/desktop */}
            <button
              id="btn-quick-alerts"
              onClick={() => setActiveView(activeView === 'alerts' ? 'dashboard' : 'alerts')}
              className={`relative p-2 rounded-lg border transition-colors ${
                alertCount > 0
                  ? 'border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Voir les alertes d'échéance (<30j)"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Company Profile Settings Button */}
            <button
              id="btn-company-profile"
              onClick={onOpenCompanyModal}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-medium transition-colors shadow-xs"
              title="Configurer les informations de l'entreprise pour les lettres"
            >
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="max-w-[130px] truncate">{companyProfile.companyName}</span>
              <SlidersHorizontal className="w-3 h-3 text-gray-400" />
            </button>

            {/* Primary Add Contract CTA */}
            <button
              id="btn-add-contract-main"
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 text-indigo-100" />
              <span>Ajouter un contrat</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
