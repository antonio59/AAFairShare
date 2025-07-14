export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  location: string;
  paidBy: string;
  split: "50/50" | "custom" | "100%";
}

export interface CategorySummary {
  name: string;
  total: number;
  percentage?: number;
}

export interface LocationSummary {
  name: string;
  total: number;
  percentage?: number;
}

export interface TrendData {
  name: string;
  value: number;
}

export interface AnalyticsData {
  totalExpenses: number;
  settlement: number;
  settlementDirection: "owes" | "owed" | "even";
  spendTrendPercentage: number;
  spendTrendReason: string;
  userComparison: {
    user1Percentage: number;
    user2Percentage: number;
    user1Total: number;
    user2Total: number;
  };
  categoryBreakdown: CategorySummary[];
  locationBreakdown: LocationSummary[];
  categoryTrends: TrendData[];
  locationTrends: TrendData[];
}
