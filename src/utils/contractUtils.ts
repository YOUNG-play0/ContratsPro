import { Contract, ContractCategory, ContractStatus, PaymentFrequency } from '../types';

export const CATEGORY_CONFIG: Record<
  ContractCategory,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  telecom: {
    label: 'Télécom & Réseaux',
    bg: 'bg-sky-50 text-sky-700',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'Radio',
  },
  assurance: {
    label: 'Assurance Pro',
    bg: 'bg-purple-50 text-purple-700',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'Shield',
  },
  saas: {
    label: 'Logiciel / SaaS',
    bg: 'bg-indigo-50 text-indigo-700',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: 'Cloud',
  },
  energie: {
    label: 'Énergie & Fluides',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: 'Zap',
  },
  maintenance: {
    label: 'Maintenance & Locaux',
    bg: 'bg-emerald-50 text-emerald-800',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: 'Wrench',
  },
  autre: {
    label: 'Autre prestation',
    bg: 'bg-gray-100 text-gray-700',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'FileText',
  },
};

export const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; badgeBg: string; badgeText: string; dotBg: string }
> = {
  active: {
    label: 'Actif',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    dotBg: 'bg-emerald-500',
  },
  watch: {
    label: 'À surveiller',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    dotBg: 'bg-amber-500',
  },
  cancel_pending: {
    label: 'À résilier',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    dotBg: 'bg-rose-500',
  },
  cancelled: {
    label: 'Résilié',
    badgeBg: 'bg-gray-100 text-gray-600 border-gray-200',
    badgeText: 'text-gray-600',
    dotBg: 'bg-gray-400',
  },
};

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  mensuel: 'Par mois',
  trimestriel: 'Par trimestre',
  annuel: 'Par an',
  ponctuel: 'Ponctuel',
  autre: 'Autre',
};

// Calculate days remaining until a specific date
export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 9999;
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate the latest date to send notice (Date d'échéance - préavis en jours)
export function getNoticeDeadlineDate(endDateStr: string, noticeDays: number): string {
  if (!endDateStr) return '';
  const end = new Date(endDateStr);
  end.setDate(end.getDate() - (noticeDays || 30));
  return end.toISOString().split('T')[0];
}

// Check if expiration is within 30 days (or expired)
export function isExpiringSoon(contract: Contract): boolean {
  const days = getDaysRemaining(contract.endDate);
  return days <= 30 && contract.status !== 'cancelled';
}

// Check if notice deadline is within 30 days
export function isNoticeDeadlineApproaching(contract: Contract): boolean {
  const noticeDate = getNoticeDeadlineDate(contract.endDate, contract.noticePeriodDays);
  const daysUntilNotice = getDaysRemaining(noticeDate);
  return daysUntilNotice <= 30 && contract.status !== 'cancelled';
}

// Format currency in EUR
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date in French
export function formatDateFr(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Calculate normalized monthly cost
export function getMonthlyEquivalent(amount: number, freq: PaymentFrequency): number {
  switch (freq) {
    case 'mensuel':
      return amount;
    case 'trimestriel':
      return amount / 3;
    case 'annuel':
      return amount / 12;
    case 'ponctuel':
    case 'autre':
      return 0;
    default:
      return amount;
  }
}

// Calculate normalized annual cost
export function getAnnualEquivalent(amount: number, freq: PaymentFrequency): number {
  switch (freq) {
    case 'mensuel':
      return amount * 12;
    case 'trimestriel':
      return amount * 4;
    case 'annuel':
      return amount;
    case 'ponctuel':
    case 'autre':
      return amount;
    default:
      return amount * 12;
  }
}
