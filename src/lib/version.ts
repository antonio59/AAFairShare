// Auto-generated version info
// This file is generated at build time

export const VERSION = '2.1.0';
export const BUILD_DATE = new Date().toISOString();

// Git commit hash (set via environment variable during build)
export const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH || 'dev';

// Feature flags to help track what's in this version
export const FEATURES = {
  pwa: true,
  oauthGoogle: true,
  savingsGoals: true,
  savingsGoalsHistory: true,
  offlineSupport: true,
  emailSettlements: true,
  recurringExpenses: true,
  analytics: true,
  mobileOptimized: true,
} as const;

// Version history for reference
export const VERSION_HISTORY = [
  { version: '2.1.0', date: '2025-11-15', features: ['PWA support', 'Mobile optimization', 'Instant loading'] },
  { version: '2.0.0', date: '2025-11-14', features: ['OAuth fix', 'Savings goals history', 'Completed goals'] },
  { version: '1.5.0', date: '2025-11-13', features: ['Savings goals', 'Email settlements'] },
  { version: '1.0.0', date: '2025-05-13', features: ['Initial release', 'Expense tracking', 'Analytics'] },
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
