export type Language = 'fr' | 'en';

export interface Translations {
  // Common / Global
  common: {
    loading: string;
    save: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    confirm: string;
    back: string;
    search: string;
    actions: string;
    status: string;
    category: string;
    amount: string;
    frequency: string;
    provider: string;
    contractName: string;
    startDate: string;
    renewalDate: string;
    noticePeriod: string;
    noticeDeadline: string;
    days: string;
    months: string;
    month: string;
    year: string;
    quarter: string;
    all: string;
    earlyAccess: string;
    free: string;
    exportPdf: string;
    copyText: string;
    copied: string;
  };

  // Statuses
  statuses: {
    active: string;
    watch: string;
    cancel_pending: string;
    cancelled: string;
  };

  // Categories
  categories: {
    all: string;
    telecom: string;
    saas: string;
    insurance: string;
    energy: string;
    facility: string;
    leasing: string;
    other: string;
  };

  // Landing Page
  landing: {
    badgeHeader: string;
    taglineHeader: string;
    navDemo: string;
    navJoin: string;
    heroBadge: string;
    heroTitlePart1: string;
    heroTitleHighlight: string;
    heroTitlePart2: string;
    heroSubtitle: string;
    heroCtaWaitlist: string;
    heroCtaDemo: string;
    heroCheckFree: string;
    heroCheckNoCard: string;
    heroCheckLegal: string;
    
    // Problem Section
    problemBadge: string;
    problemTitle: string;
    problemSubtitle: string;
    problem1Title: string;
    problem1Desc: string;
    problem2Title: string;
    problem2Desc: string;
    problem3Title: string;
    problem3Desc: string;

    // Solution Section
    solutionBadge: string;
    solutionTitle: string;
    solutionSubtitle: string;
    solution1Title: string;
    solution1Desc: string;
    solution2Title: string;
    solution2Desc: string;
    solution3Title: string;
    solution3Desc: string;
    solution4Title: string;
    solution4Desc: string;

    // Waitlist Section
    waitlistBadge: string;
    waitlistTitle: string;
    waitlistSubtitle: string;
    companyLabel: string;
    companyPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successDesc: string;
    successDemoButton: string;
    spamNote: string;
    invalidEmailError: string;

    // Footer
    footerBrand: string;
    footerRights: string;
    footerAppDemo: string;
  };

  // Dashboard & App Navigation
  nav: {
    home: string;
    dashboard: string;
    alerts: string;
    history: string;
    addContract: string;
    companySettings: string;
    waitlistBannerTitle: string;
    waitlistBannerAction: string;
  };

  // Dashboard Stats & KPI
  stats: {
    activeContracts: string;
    activeContractsSub: string;
    urgentAlerts: string;
    urgentAlertsSub: string;
    monthlyBudget: string;
    monthlyBudgetSub: string;
    annualBudget: string;
    annualBudgetSub: string;
    filterByCategory: string;
    allCategories: string;
    contractsCount: string;
  };

  // Contract Table & Alerts
  contractTable: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterCategory: string;
    filterStatus: string;
    tableHeaderContract: string;
    tableHeaderCategory: string;
    tableHeaderAmount: string;
    tableHeaderRenewal: string;
    tableHeaderNotice: string;
    tableHeaderStatus: string;
    tableHeaderActions: string;
    emptySearch: string;
    emptySubtitle: string;
    btnLetter: string;
    btnDetails: string;
    btnDelete: string;
    badgeExpiring: string;
    badgeNoticeSoon: string;
    autoRenew: string;
    fixedTerm: string;
  };

  // Alerts View
  alertsView: {
    title: string;
    subtitle: string;
    urgentNoticeTitle: string;
    urgentNoticeDesc: string;
    expiringTitle: string;
    expiringDesc: string;
    noAlerts: string;
    noAlertsDesc: string;
  };

  // Modals & Settings
  modals: {
    addTitle: string;
    addSub: string;
    tabManual: string;
    tabAiExtract: string;
    companyTitle: string;
    companySub: string;
    letterTitle: string;
    letterSub: string;
  };
}
