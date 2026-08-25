export type ContractCategory =
  | 'telecom'
  | 'assurance'
  | 'saas'
  | 'energie'
  | 'maintenance'
  | 'autre';

export type PaymentFrequency =
  | 'mensuel'
  | 'trimestriel'
  | 'annuel'
  | 'ponctuel'
  | 'autre';

export type ContractStatus =
  | 'active'        // Actif
  | 'watch'         // À surveiller
  | 'cancel_pending'// À résilier
  | 'cancelled';    // Résilié

export interface CancellationContact {
  recipientName?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ContractAction {
  id: string;
  date: string;
  type: 'created' | 'updated' | 'letter_generated' | 'status_changed' | 'alert_viewed';
  description: string;
  user?: string;
}

export interface Contract {
  id: string;
  vendorName: string;
  contractNumber?: string;
  category: ContractCategory;
  amount: number;
  currency: string;
  paymentFrequency: PaymentFrequency;
  signatureDate?: string;
  startDate?: string;
  commitmentDurationMonths?: number;
  endDate: string; // Date d'échéance YYYY-MM-DD
  noticePeriodDays: number; // Préavis en jours
  tacitRenewal: boolean; // Reconduction tacite
  cancellationContact?: CancellationContact;
  keyClauses?: string[];
  summary?: string;
  status: ContractStatus;
  notes?: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  createdAt: string;
  updatedAt: string;
  actions: ContractAction[];
  lastGeneratedLetter?: string;
}

export interface CompanyProfile {
  companyName: string;
  siret: string;
  address: string;
  postalCode: string;
  city: string;
  country?: string;
  signatoryName: string;
  signatoryTitle: string;
  email: string;
  phone: string;
}

export interface ContractStats {
  totalCount: number;
  activeCount: number;
  watchCount: number;
  cancelPendingCount: number;
  expiringSoonCount: number; // < 30 days
  noticeSoonCount: number;   // notice deadline in < 30 days
  totalMonthlySpend: number;
  totalAnnualSpend: number;
}
