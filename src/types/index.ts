export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;  // Adding email as an optional property to match actual usage
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  location: string;
  description?: string;
  paidBy: string; // User ID
  split: string; // "50/50", "custom"
  splitRatio?: number; // If custom split, percentage for first user
}

export interface RecurringExpense {
  id: string;
  amount: number;
  nextDueDate: string;
  category: string;
  location: string;
  description?: string;
  userId: string; // User ID
  frequency: string; // "weekly", "monthly", "yearly"
  split: string; // "50/50", "custom"
}

export interface MonthData {
  totalExpenses: number;
  fairShare: number;
  settlement: number;
  settlementDirection: 'owes' | 'owed' | 'even';
  user1Paid: number;
  user2Paid: number;
  user1Name?: string; // Add user1Name
  user2Name?: string; // Add user2Name
  expenses: Expense[];
}

export interface CategorySummary {
  name: string;
  amount: number;
  percentage: number;
}

export interface LocationSummary {
  name: string;
  amount: number;
  percentage: number;
}

export interface ExpenseTrend {
  month: string;
  total: number;
  user1: number;
  user2: number;
}

export interface AnalyticsData {
  userComparison: {
    user1Percentage: number;
    user2Percentage: number;
  };
  categoryBreakdown: CategorySummary[];
  locationBreakdown: LocationSummary[];
  totalExpenses: number;
  fairShare: number;
  settlement: number;
  settlementDirection: 'owes' | 'owed' | 'even';
  trends?: ExpenseTrend[]; // Made optional since we're not using it currently
}
