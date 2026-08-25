export interface CountryOption {
  code: string;
  name: string;
  nameEn: string;
  region: 'france' | 'eu' | 'world';
}

export const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

export const COUNTRIES_LIST: CountryOption[] = [
  // France (Level 1)
  { code: 'FR', name: 'France 🇫🇷', nameEn: 'France', region: 'france' },
  
  // European Union (Level 2)
  { code: 'DE', name: 'Allemagne 🇩🇪', nameEn: 'Germany', region: 'eu' },
  { code: 'BE', name: 'Belgique 🇧🇪', nameEn: 'Belgium', region: 'eu' },
  { code: 'ES', name: 'Espagne 🇪🇸', nameEn: 'Spain', region: 'eu' },
  { code: 'IT', name: 'Italie 🇮🇹', nameEn: 'Italy', region: 'eu' },
  { code: 'NL', name: 'Pays-Bas 🇳🇱', nameEn: 'Netherlands', region: 'eu' },
  { code: 'PT', name: 'Portugal 🇵🇹', nameEn: 'Portugal', region: 'eu' },
  { code: 'IE', name: 'Irlande 🇮🇪', nameEn: 'Ireland', region: 'eu' },
  { code: 'PL', name: 'Pologne 🇵🇱', nameEn: 'Poland', region: 'eu' },
  { code: 'AT', name: 'Autriche 🇦🇹', nameEn: 'Austria', region: 'eu' },
  { code: 'SE', name: 'Suède 🇸🇪', nameEn: 'Sweden', region: 'eu' },
  { code: 'DK', name: 'Danemark 🇩🇰', nameEn: 'Denmark', region: 'eu' },
  { code: 'FI', name: 'Finlande 🇫🇮', nameEn: 'Finland', region: 'eu' },
  { code: 'LU', name: 'Luxembourg 🇱🇺', nameEn: 'Luxembourg', region: 'eu' },
  { code: 'GR', name: 'Grèce 🇬🇷', nameEn: 'Greece', region: 'eu' },
  { code: 'CZ', name: 'République tchèque 🇨🇿', nameEn: 'Czech Republic', region: 'eu' },
  { code: 'HU', name: 'Hongrie 🇭🇺', nameEn: 'Hungary', region: 'eu' },
  { code: 'RO', name: 'Roumanie 🇷🇴', nameEn: 'Romania', region: 'eu' },
  { code: 'BG', name: 'Bulgarie 🇧🇬', nameEn: 'Bulgaria', region: 'eu' },
  { code: 'SK', name: 'Slovaquie 🇸🇰', nameEn: 'Slovakia', region: 'eu' },
  { code: 'HR', name: 'Croatie 🇭🇷', nameEn: 'Croatia', region: 'eu' },
  { code: 'SI', name: 'Slovénie 🇸🇮', nameEn: 'Slovenia', region: 'eu' },
  { code: 'LT', name: 'Lituanie 🇱🇹', nameEn: 'Lithuania', region: 'eu' },
  { code: 'LV', name: 'Lettonie 🇱🇻', nameEn: 'Latvia', region: 'eu' },
  { code: 'EE', name: 'Estonie 🇪🇪', nameEn: 'Estonia', region: 'eu' },
  { code: 'CY', name: 'Chypre 🇨🇾', nameEn: 'Cyprus', region: 'eu' },
  { code: 'MT', name: 'Malte 🇲🇹', nameEn: 'Malta', region: 'eu' },

  // Rest of the World (Level 3)
  { code: 'GB', name: 'Royaume-Uni 🇬🇧', nameEn: 'United Kingdom', region: 'world' },
  { code: 'CH', name: 'Suisse 🇨🇭', nameEn: 'Switzerland', region: 'world' },
  { code: 'US', name: 'États-Unis 🇺🇸', nameEn: 'United States', region: 'world' },
  { code: 'CA', name: 'Canada 🇨🇦', nameEn: 'Canada', region: 'world' },
  { code: 'AU', name: 'Australie 🇦🇺', nameEn: 'Australia', region: 'world' },
  { code: 'JP', name: 'Japon 🇯🇵', nameEn: 'Japan', region: 'world' },
  { code: 'SG', name: 'Singapour 🇸🇬', nameEn: 'Singapore', region: 'world' },
  { code: 'MA', name: 'Maroc 🇲🇦', nameEn: 'Morocco', region: 'world' },
  { code: 'TN', name: 'Tunisie 🇹🇳', nameEn: 'Tunisia', region: 'world' },
  { code: 'DZ', name: 'Algérie 🇩🇿', nameEn: 'Algeria', region: 'world' },
  { code: 'SN', name: 'Sénégal 🇸🇳', nameEn: 'Senegal', region: 'world' },
  { code: 'CI', name: 'Côte d’Ivoire 🇨🇮', nameEn: 'Ivory Coast', region: 'world' },
  { code: 'AE', name: 'Émirats arabes unis 🇦🇪', nameEn: 'United Arab Emirates', region: 'world' },
  { code: 'BR', name: 'Brésil 🇧🇷', nameEn: 'Brazil', region: 'world' },
  { code: 'IN', name: 'Inde 🇮🇳', nameEn: 'India', region: 'world' },
  { code: 'MX', name: 'Mexique 🇲🇽', nameEn: 'Mexico', region: 'world' },
  { code: 'OTHER', name: 'Autre pays / Other country 🌐', nameEn: 'Other country', region: 'world' },
];

export interface LegalConfidenceInfo {
  level: 1 | 2 | 3;
  label: string;
  badgeText: string;
  note: string;
  disclaimer: string;
  badgeStyle: string;
  levelTitle: string;
}

export function getLegalConfidenceLevel(countryCode?: string): LegalConfidenceInfo {
  const code = (countryCode || 'FR').toUpperCase().trim();

  if (code === 'FR' || code === 'FRANCE') {
    return {
      level: 1,
      levelTitle: 'Niveau 1 — Droit positif français',
      label: 'Droit français complet',
      badgeText: 'Niveau 1 • Droit Français',
      note: 'Lettre générée avec références légales françaises',
      disclaimer: 'Conforme aux articles 1103 & 1211 du Code civil, Loi Châtel et formalisme d’envoi recommandé (LRAR).',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (EU_COUNTRY_CODES.has(code)) {
    return {
      level: 2,
      levelTitle: 'Niveau 2 — Espace Union Européenne',
      label: 'Prudence juridique UE',
      badgeText: 'Niveau 2 • Union Européenne',
      note: 'Lettre générée avec prudence juridique (UE) — vérification recommandée',
      disclaimer: 'Formulation contractuelle conforme aux principes du marché unique européen. Une relecture par un juriste local est recommandée car la transposition du droit varie selon chaque État membre.',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }

  return {
    level: 3,
    levelTitle: 'Niveau 3 — International / Reste du Monde',
    label: 'Standard contractuel international',
    badgeText: 'Niveau 3 • International',
    note: 'Lettre générique — vérification par un professionnel local fortement recommandée',
    disclaimer: 'Formulation contractuelle ferme et neutre (sans citation de loi spécifique). Vérification par un professionnel juridique local fortement recommandée avant tout envoi officiel.',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
  };
}
