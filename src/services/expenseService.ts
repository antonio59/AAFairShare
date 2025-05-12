// This file exports functionality from our more focused services

// Export utilities
export { getCurrentMonth, getCurrentYear, getCurrentMonthLabel } from './utils/dateUtils';
export { formatMonthString } from './utils/dateUtils';

// Export API services
export { getUsers } from './api/userService';
export { getCategories, createCategory, deleteCategory, checkCategoryUsage } from './api/categoryService';
export { getLocations, createLocation, deleteLocation, checkLocationUsage } from './api/locationService';
export { 
  addExpense, 
  updateExpense, 
  deleteExpense,
} from './api/expenseService';
export {
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  generateExpenseFromRecurring
} from './api/recurringExpenseService';
export { markSettlementComplete, markSettlementUnsettled, checkSettlementExists } from './api/settlementService';
export { sendSettlementEmail } from './api/emailService';

// Export data services
export { getMonthData } from './data/monthDataService';
export { getAnalyticsData } from './data/analyticsService';

// Export export services
export { exportToCSV, downloadCSV, downloadPDF, generateSettlementReportPDF } from './export';
