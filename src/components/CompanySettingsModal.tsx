import React, { useState } from 'react';
import { X, Building2, Save, Check, Globe, Shield } from 'lucide-react';
import { CompanyProfile } from '../types';
import { COUNTRIES_LIST, getLegalConfidenceLevel } from '../utils/countryUtils';

interface CompanySettingsModalProps {
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  companyProfile,
  isOpen,
  onClose,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<CompanyProfile>({
    ...companyProfile,
    country: companyProfile.country || 'FR',
  });
  const [saved, setSaved] = useState(false);

  const selectedLegalTier = getLegalConfidenceLevel(form.country);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/80 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Profil de votre entreprise
              </h2>
              <p className="text-xs text-gray-500">
                Informations utilisées pour l'en-tête et le cadre juridique des lettres de résiliation
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Raison Sociale / Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900 font-medium"
            />
          </div>

          {/* Country Selection & Legal Tier Indicator */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-800 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Pays d'établissement de l'entreprise (Juridiction) *</span>
              </label>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${selectedLegalTier.badgeStyle}`}>
                {selectedLegalTier.badgeText}
              </span>
            </div>

            <select
              id="country-select"
              value={form.country || 'FR'}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900 bg-white font-medium"
            >
              <optgroup label="Niveau 1 — France (Droit positif, Code civil, Loi Châtel & L. 442-1)">
                {COUNTRIES_LIST.filter((c) => c.region === 'france').map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Niveau 2 — Union Européenne & États-Unis (Prudence juridique)">
                {COUNTRIES_LIST.filter((c) => c.region === 'eu_us').map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Niveau 3 — Royaume-Uni, Canada & Espace OHADA (Afrique)">
                {COUNTRIES_LIST.filter((c) => c.region === 'uk_ca_ohada').map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Niveau 4 — Reste du Monde & International (Minimaliste factuel)">
                {COUNTRIES_LIST.filter((c) => c.region === 'world').map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="flex items-start space-x-2 text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200/80">
              <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <span className="font-semibold text-gray-800">{selectedLegalTier.levelTitle} : </span>
                {selectedLegalTier.disclaimer}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Numéro d'immatriculation / SIRET / TVA
              </label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="Ex: 842 195 432 00028 ou CHE-123..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Téléphone de contact
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ex: +33 1 42 68 55 00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Adresse du siège social
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ex: 14 rue du Faubourg Saint-Honoré"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                placeholder="75008"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Paris"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Nom du signataire légal
              </label>
              <input
                type="text"
                value={form.signatoryName}
                onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
                placeholder="Ex: Alexandre Dupont"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fonction du signataire
              </label>
              <input
                type="text"
                value={form.signatoryTitle}
                onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
                placeholder="Ex: Managing Director / Directeur Général"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Email officiel pour notification
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Ex: legal@company.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-gray-900"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

