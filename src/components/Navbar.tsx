import React from 'react';
import {
  Plus,
  Bell,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { CompanyProfile } from '../types';
import appLogo from '../assets/images/app_logo_1787718358200.jpg';
import { useLanguage, LanguageSelector } from '../i18n/LanguageContext';

interface NavbarProps {
  companyProfile: CompanyProfile;
  alertCount: number;
  activeView: 'dashboard' | 'alerts';
  setActiveView: (view: 'dashboard' | 'alerts') => void;
  onOpenAddModal: () => void;
  onOpenCompanyModal: () => void;
  onNavigateToLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyProfile,
  alertCount,
  activeView,
  setActiveView,
  onOpenAddModal,
  onOpenCompanyModal,
  onNavigateToLanding,
}) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5.75rem] py-2.5">
          {/* Brand & Title */}
          <div className="flex items-center space-x-6">
            <div
              id="brand-logo-container"
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => setActiveView('dashboard')}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-xs border border-gray-200/90 bg-white flex items-center justify-center p-1 group-hover:scale-105 group-hover:shadow-md transition-all duration-200 shrink-0">
                <img
                  src={appLogo}
                  alt="ContratsPro Logo"
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 tracking-tight text-xl sm:text-2xl">
                    ContratsPro
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    B2B
                  </span>
                </div>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">
                  {t.landing.taglineHeader}
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-gray-200">
              {onNavigateToLanding && (
                <button
                  id="nav-tab-landing"
                  onClick={onNavigateToLanding}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                >
                  {t.nav.home}
                </button>
              )}
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.nav.dashboard}
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
                <span>{t.nav.alerts}</span>
                {alertCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-600 rounded-full">
                    {alertCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Action buttons & Language selector */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Language Selector Switcher in Dashboard Navbar */}
            <LanguageSelector variant="light" />

            {/* Alert Bell Button for mobile/desktop */}
            <button
              id="btn-quick-alerts"
              onClick={() => setActiveView(activeView === 'alerts' ? 'dashboard' : 'alerts')}
              className={`relative p-2 rounded-lg border transition-colors ${
                alertCount > 0
                  ? 'border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title={t.stats.urgentAlerts}
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
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-medium transition-colors shadow-xs cursor-pointer"
              title={t.nav.companySettings}
            >
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="max-w-[130px] truncate">{companyProfile.companyName || 'Mon Entreprise'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                {companyProfile.country || 'FR'}
              </span>
              <SlidersHorizontal className="w-3 h-3 text-gray-400" />
            </button>

            {/* Primary Add Contract CTA */}
            <button
              id="btn-add-contract-main"
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 text-indigo-100" />
              <span>{t.nav.addContract}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
