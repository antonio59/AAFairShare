// Auto-generated version info
// This file is generated at build time

export const VERSION = '3.2.0';
export const BUILD_DATE = new Date().toISOString();

// Git commit hash (set via environment variable during build)
export const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH || 'dev';

// Feature flags to help track what's in this version
export const FEATURES = {
  emailAuth: true,
  savingsGoals: true,
  savingsGoalsHistory: true,
  emailSettlements: true,
  recurringExpenses: true,
  analytics: true,
  mobileOptimized: true,
  darkMode: true,
  receiptStorage: true,
  receiptCamera: true,
  goalMilestones: true,
  quickAddWidget: true,
  yearEndSummary: true,
  exportPdfCsv: true,
  errorBoundary: true,
  settlementBreakdown: true,
} as const;

// Version history for reference
export const VERSION_HISTORY = [
  { 
    version: '3.2.0', 
    date: '2025-12-11', 
    features: [
      'Settlement breakdown with detailed calculations',
      'Improved settlement history with undo option',
      'Fixed Analytics (Fair Share, Spend Trend, Charts)',
      'Added ErrorBoundary for graceful error handling',
      'Removed PWA to simplify deployments',
      'Dark mode fixes for Settings page',
    ] 
  },
  { 
    version: '3.1.1', 
    date: '2025-12-06', 
    features: [
      'Input validation across all Convex endpoints',
      'Bun-first build pipeline',
      'Portfolio landing page updates',
      'Expense table layout refinements',
    ] 
  },
  { 
    version: '3.1.0', 
    date: '2024-12-02', 
    features: [
      'Email/Password authentication',
      'Dark mode with theme toggle',
      'Receipt storage (standalone & expense-attached)',
      'Goal milestones and monthly targets',
      'Quick add widget with presets',
      'Year-end summary analytics',
      'CSV/PDF export',
    ] 
  },
  { 
    version: '3.0.0', 
    date: '2024-12-01', 
    features: [
      'Convex backend migration',
      'Google OAuth authentication',
      'Real-time data sync',
      'Individual contribution tracking',
      'Settlement email notifications',
      'Goal completion emails',
    ] 
  },
  { version: '2.1.0', date: '2024-11-15', features: ['Mobile optimization', 'Performance improvements'] },
  { version: '2.0.0', date: '2024-11-14', features: ['OAuth fix', 'Savings goals history', 'Completed goals'] },
  { version: '1.5.0', date: '2024-11-13', features: ['Savings goals', 'Email settlements'] },
  { version: '1.0.0', date: '2024-05-13', features: ['Initial release', 'Expense tracking', 'Analytics'] },
] as const;

// Get full version string with commit
export const getFullVersion = () => {
  return `v${VERSION} (${COMMIT_HASH.substring(0, 7)})`;
};

// Get build info
export const getBuildInfo = () => {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    commit: COMMIT_HASH,
    features: FEATURES,
  };
};
