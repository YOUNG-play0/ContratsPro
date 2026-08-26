import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, Translations } from './types';
import { translations } from './translations';
import { Globe } from 'lucide-react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'contratspro_language';

/**
 * Detect user language:
 * 1. Check localStorage for saved manual preference.
 * 2. If absent, check navigator.language / navigator.languages:
 *    - If starts with 'fr' -> 'fr'
 *    - Any other language (en, de, es, it, zh, ja, etc.) -> 'en' (universal fallback)
 */
function detectInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore storage read error
  }

  // Browser language detection
  try {
    const browserLangs = navigator.languages || [navigator.language || ''];
    for (const lang of browserLangs) {
      if (!lang) continue;
      const lower = lang.toLowerCase();
      if (lower.startsWith('fr')) {
        return 'fr';
      }
    }
  } catch {
    // Fallback if navigator is restricted
  }

  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectInitialLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage write errors
    }
  };

  const t = useMemo(() => translations[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageSelectorProps {
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'light',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl p-1 text-xs font-semibold select-none border transition-colors ${
        variant === 'dark'
          ? 'bg-white/10 border-white/20 text-white'
          : variant === 'glass'
          ? 'bg-white/80 border-slate-200 text-slate-700 shadow-xs'
          : 'bg-slate-100 border-slate-200/80 text-slate-700'
      } ${className}`}
    >
      <div className="flex items-center px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        id="lang-btn-fr"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          language === 'fr'
            ? variant === 'dark'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'bg-white text-indigo-700 font-bold shadow-xs'
            : 'hover:text-slate-900 text-slate-500'
        }`}
        title="Français"
      >
        FR
      </button>

      <button
        type="button"
        id="lang-btn-en"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          language === 'en'
            ? variant === 'dark'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'bg-white text-indigo-700 font-bold shadow-xs'
            : 'hover:text-slate-900 text-slate-500'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
};
