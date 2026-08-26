export interface CountryOption {
  code: string;
  name: string;
  nameEn: string;
  region: 'france' | 'eu_us' | 'uk_ca_ohada' | 'world';
  level: 1 | 2 | 3 | 4;
}

export const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 
  'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

export const OHADA_COUNTRY_CODES = new Set([
  'BJ', 'BF', 'CM', 'CF', 'KM', 'CG', 'CD', 'CI', 'GA', 'GN', 
  'GW', 'GQ', 'ML', 'NE', 'SN', 'TD', 'TG'
]);

export const COUNTRIES_LIST: CountryOption[] = [
  // NIVEAU 1 : France
  { code: 'FR', name: 'France 🇫🇷', nameEn: 'France', region: 'france', level: 1 },
  
  // NIVEAU 2 : Union Européenne + États-Unis
  { code: 'DE', name: 'Allemagne 🇩🇪', nameEn: 'Germany', region: 'eu_us', level: 2 },
  { code: 'BE', name: 'Belgique 🇧🇪', nameEn: 'Belgium', region: 'eu_us', level: 2 },
  { code: 'ES', name: 'Espagne 🇪🇸', nameEn: 'Spain', region: 'eu_us', level: 2 },
  { code: 'IT', name: 'Italie 🇮🇹', nameEn: 'Italy', region: 'eu_us', level: 2 },
  { code: 'NL', name: 'Pays-Bas 🇳🇱', nameEn: 'Netherlands', region: 'eu_us', level: 2 },
  { code: 'PT', name: 'Portugal 🇵🇹', nameEn: 'Portugal', region: 'eu_us', level: 2 },
  { code: 'IE', name: 'Irlande 🇮🇪', nameEn: 'Ireland', region: 'eu_us', level: 2 },
  { code: 'PL', name: 'Pologne 🇵🇱', nameEn: 'Poland', region: 'eu_us', level: 2 },
  { code: 'AT', name: 'Autriche 🇦🇹', nameEn: 'Austria', region: 'eu_us', level: 2 },
  { code: 'SE', name: 'Suède 🇸🇪', nameEn: 'Sweden', region: 'eu_us', level: 2 },
  { code: 'DK', name: 'Danemark 🇩🇰', nameEn: 'Denmark', region: 'eu_us', level: 2 },
  { code: 'FI', name: 'Finlande 🇫🇮', nameEn: 'Finland', region: 'eu_us', level: 2 },
  { code: 'LU', name: 'Luxembourg 🇱🇺', nameEn: 'Luxembourg', region: 'eu_us', level: 2 },
  { code: 'GR', name: 'Grèce 🇬🇷', nameEn: 'Greece', region: 'eu_us', level: 2 },
  { code: 'CZ', name: 'République tchèque 🇨🇿', nameEn: 'Czech Republic', region: 'eu_us', level: 2 },
  { code: 'HU', name: 'Hongrie 🇭🇺', nameEn: 'Hungary', region: 'eu_us', level: 2 },
  { code: 'RO', name: 'Roumanie 🇷🇴', nameEn: 'Romania', region: 'eu_us', level: 2 },
  { code: 'BG', name: 'Bulgarie 🇧🇬', nameEn: 'Bulgaria', region: 'eu_us', level: 2 },
  { code: 'SK', name: 'Slovaquie 🇸🇰', nameEn: 'Slovakia', region: 'eu_us', level: 2 },
  { code: 'HR', name: 'Croatie 🇭🇷', nameEn: 'Croatia', region: 'eu_us', level: 2 },
  { code: 'SI', name: 'Slovénie 🇸🇮', nameEn: 'Slovenia', region: 'eu_us', level: 2 },
  { code: 'LT', name: 'Lituanie 🇱🇹', nameEn: 'Lithuania', region: 'eu_us', level: 2 },
  { code: 'LV', name: 'Lettonie 🇱🇻', nameEn: 'Latvia', region: 'eu_us', level: 2 },
  { code: 'EE', name: 'Estonie 🇪🇪', nameEn: 'Estonia', region: 'eu_us', level: 2 },
  { code: 'CY', name: 'Chypre 🇨🇾', nameEn: 'Cyprus', region: 'eu_us', level: 2 },
  { code: 'MT', name: 'Malte 🇲🇹', nameEn: 'Malta', region: 'eu_us', level: 2 },
  { code: 'US', name: 'États-Unis 🇺🇸', nameEn: 'United States', region: 'eu_us', level: 2 },

  // NIVEAU 3 : UK, Canada & Espace OHADA (Afrique)
  { code: 'GB', name: 'Royaume-Uni 🇬🇧', nameEn: 'United Kingdom', region: 'uk_ca_ohada', level: 3 },
  { code: 'CA', name: 'Canada 🇨🇦', nameEn: 'Canada', region: 'uk_ca_ohada', level: 3 },
  { code: 'SN', name: 'Sénégal 🇸🇳 (OHADA)', nameEn: 'Senegal', region: 'uk_ca_ohada', level: 3 },
  { code: 'CI', name: 'Côte d’Ivoire 🇨🇮 (OHADA)', nameEn: 'Ivory Coast', region: 'uk_ca_ohada', level: 3 },
  { code: 'CM', name: 'Cameroun 🇨🇲 (OHADA)', nameEn: 'Cameroon', region: 'uk_ca_ohada', level: 3 },
  { code: 'BJ', name: 'Bénin 🇧🇯 (OHADA)', nameEn: 'Benin', region: 'uk_ca_ohada', level: 3 },
  { code: 'BF', name: 'Burkina Faso 🇧🇫 (OHADA)', nameEn: 'Burkina Faso', region: 'uk_ca_ohada', level: 3 },
  { code: 'GA', name: 'Gabon 🇬🇦 (OHADA)', nameEn: 'Gabon', region: 'uk_ca_ohada', level: 3 },
  { code: 'ML', name: 'Mali 🇲🇱 (OHADA)', nameEn: 'Mali', region: 'uk_ca_ohada', level: 3 },
  { code: 'GN', name: 'Guinée 🇬🇳 (OHADA)', nameEn: 'Guinea', region: 'uk_ca_ohada', level: 3 },
  { code: 'CD', name: 'RD Congo 🇨🇩 (OHADA)', nameEn: 'DR Congo', region: 'uk_ca_ohada', level: 3 },
  { code: 'CG', name: 'Congo 🇨🇬 (OHADA)', nameEn: 'Congo', region: 'uk_ca_ohada', level: 3 },
  { code: 'TG', name: 'Togo 🇹🇬 (OHADA)', nameEn: 'Togo', region: 'uk_ca_ohada', level: 3 },
  { code: 'NE', name: 'Niger 🇳🇪 (OHADA)', nameEn: 'Niger', region: 'uk_ca_ohada', level: 3 },
  { code: 'TD', name: 'Tchad 🇹🇩 (OHADA)', nameEn: 'Chad', region: 'uk_ca_ohada', level: 3 },
  { code: 'CF', name: 'Centrafrique 🇨🇫 (OHADA)', nameEn: 'Central African Republic', region: 'uk_ca_ohada', level: 3 },
  { code: 'KM', name: 'Comores 🇰🇲 (OHADA)', nameEn: 'Comoros', region: 'uk_ca_ohada', level: 3 },

  // NIVEAU 4 : Reste du Monde / Autres Juridictions
  { code: 'CH', name: 'Suisse 🇨🇭', nameEn: 'Switzerland', region: 'world', level: 4 },
  { code: 'AU', name: 'Australie 🇦🇺', nameEn: 'Australia', region: 'world', level: 4 },
  { code: 'JP', name: 'Japon 🇯🇵', nameEn: 'Japan', region: 'world', level: 4 },
  { code: 'SG', name: 'Singapour 🇸🇬', nameEn: 'Singapore', region: 'world', level: 4 },
  { code: 'MA', name: 'Maroc 🇲🇦', nameEn: 'Morocco', region: 'world', level: 4 },
  { code: 'TN', name: 'Tunisie 🇹🇳', nameEn: 'Tunisia', region: 'world', level: 4 },
  { code: 'DZ', name: 'Algérie 🇩🇿', nameEn: 'Algeria', region: 'world', level: 4 },
  { code: 'AE', name: 'Émirats arabes unis 🇦🇪', nameEn: 'United Arab Emirates', region: 'world', level: 4 },
  { code: 'BR', name: 'Brésil 🇧🇷', nameEn: 'Brazil', region: 'world', level: 4 },
  { code: 'IN', name: 'Inde 🇮🇳', nameEn: 'India', region: 'world', level: 4 },
  { code: 'MX', name: 'Mexique 🇲🇽', nameEn: 'Mexico', region: 'world', level: 4 },
  { code: 'OTHER', name: 'Autre pays non listé 🌐', nameEn: 'Other unlisted country', region: 'world', level: 4 },
];

export interface LegalConfidenceInfo {
  level: 1 | 2 | 3 | 4;
  label: string;
  badgeText: string;
  note: string;
  disclaimer: string;
  badgeStyle: string;
  levelTitle: string;
  jurisdictionCategory: 'FR' | 'EU_US' | 'UK_CA_OHADA' | 'WORLD';
}

export function getLegalConfidenceLevel(countryCode?: string): LegalConfidenceInfo {
  const code = (countryCode || 'FR').toUpperCase().trim();

  // NIVEAU 1 : France
  if (code === 'FR' || code === 'FRANCE') {
    return {
      level: 1,
      jurisdictionCategory: 'FR',
      levelTitle: 'Niveau 1 — Droit positif français',
      label: 'Droit français positif & complet',
      badgeText: 'Niveau 1 • Droit Français',
      note: 'Lettre générée avec références légales françaises précises (Code civil, Code de commerce, Loi Châtel, LRAR).',
      disclaimer: 'Conforme aux articles 1103 et 1211 du Code civil, Loi Châtel et formalisme d’envoi LRAR. Analyse du risque de rupture brutale (art. L. 442-1 C. com.) intégrée.',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  // NIVEAU 2 : Union Européenne (26 pays sans FR) + USA
  if (EU_COUNTRY_CODES.has(code) || code === 'US' || code === 'USA') {
    const isUSA = code === 'US' || code === 'USA';
    return {
      level: 2,
      jurisdictionCategory: 'EU_US',
      levelTitle: isUSA ? 'Niveau 2 — États-Unis (Common Law / Louisiane)' : 'Niveau 2 — Espace Union Européenne',
      label: isUSA ? 'Droit contractuel US (Common Law / Civil Law)' : 'Prudence juridique UE',
      badgeText: isUSA ? 'Niveau 2 • États-Unis' : 'Niveau 2 • Union Européenne',
      note: isUSA 
        ? 'Lettre générée avec respect strict du contrat écrit US et distinction Common Law / droit civil de Louisiane.'
        : 'Lettre générée avec prudence juridique UE basée sur le respect du préavis contractuel sans citation d’articles nationaux.',
      disclaimer: isUSA
        ? 'Formulation basée sur le strict respect du contrat écrit (Common Law pour 49 États / droit mixte pour la Louisiane), sans référence à des lois externes non vérifiées.'
        : 'Formulation prudente basée sur le respect scrupuleux du préavis contractuel et des principes du marché unique européen. Relecture recommandée.',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }

  // NIVEAU 3 : UK, Canada & Espace OHADA
  if (code === 'GB' || code === 'UK' || code === 'CA' || OHADA_COUNTRY_CODES.has(code)) {
    const isOHADA = OHADA_COUNTRY_CODES.has(code);
    const isUK = code === 'GB' || code === 'UK';
    return {
      level: 3,
      jurisdictionCategory: 'UK_CA_OHADA',
      levelTitle: isOHADA ? 'Niveau 3 — Espace OHADA (Afrique commerciale)' : isUK ? 'Niveau 3 — Royaume-Uni (UK Law)' : 'Niveau 3 — Canada',
      label: isOHADA ? 'Espace OHADA (Droit commercial unifié)' : 'Droit contractuel UK / Canada',
      badgeText: isOHADA ? 'Niveau 3 • Espace OHADA' : isUK ? 'Niveau 3 • Royaume-Uni' : 'Niveau 3 • Canada',
      note: isOHADA
        ? 'Lettre formulée selon les stipulations du contrat avec référence prudente aux principes de l’Acte uniforme OHADA.'
        : 'Lettre rédigée strictly under contractual terms (aucune référence légale externe).',
      disclaimer: isOHADA
        ? 'Formulation contractuelle adaptée à l’espace OHADA, fondée sur les termes du contrat et les principes généraux de l’Acte uniforme portant sur le droit commercial général.'
        : 'Formulation purement contractuelle (« strictly under the contractual terms ») sans citation de textes législatifs externes.',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }

  // NIVEAU 4 : Reste du monde / pays non listés
  return {
    level: 4,
    jurisdictionCategory: 'WORLD',
    levelTitle: 'Niveau 4 — Reste du Monde / International',
    label: 'Standard minimaliste et factuel',
    badgeText: 'Niveau 4 • International',
    note: 'Lettre minimaliste et factuelle rappelant les termes du contrat et la date d’effet souhaitée.',
    disclaimer: 'Formulation purement factuelle et neutre, sans aucune référence légale. Vérification par un juriste ou avocat local recommandée en cas d’enjeu significatif.',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
  };
}

/**
 * Calcule la durée totale en mois de la relation commerciale
 * depuis la date de début de relation (ou date de début / signature) jusqu'à aujourd'hui
 */
export function calculateRelationshipDurationMonths(startDateStr?: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

/**
 * Vérifie si la relation commerciale dépasse 24 mois (2 ans)
 * Ce seuil déclenche l'alerte sur le risque de rupture brutale des relations commerciales établies (art. L. 442-1 C. com.)
 */
export function isRelationOver24Months(contract: {
  relationshipStartDate?: string;
  startDate?: string;
  signatureDate?: string;
}): boolean {
  const refDate = contract.relationshipStartDate || contract.startDate || contract.signatureDate;
  if (!refDate) return false;
  return calculateRelationshipDurationMonths(refDate) >= 24;
}

/**
 * Mention permanente de non-responsabilité juridique pour l'interface
 */
export const LEGAL_DISCLAIMER_TEXT =
  "Outil d'aide à la rédaction. Ne constitue pas un conseil juridique. En cas de doute ou d'enjeu financier important, consultez un avocat ou un juriste qualifié dans la juridiction compétente.";

