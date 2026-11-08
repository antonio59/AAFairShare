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
  linkedDocumentIds?: string[] | null;
  linkedGoalIds?: string[] | null;
  /** £ of refund credit on this bill. */
  creditApplied?: number;
  creditUses?: ExpenseCreditUse[];
  /** An open credit could cover more of this bill. */
  creditAvailable?: boolean;
  householdBill?: boolean;
  monthSettled?: boolean;
}

export interface ExpenseCreditUse {
  allocationId: string;
  creditId: string;
  label: string;
  amount: number;
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

export interface RecurringExpense {
  id: string;
  amount: number;
  nextDueDate: string;
  endDate?: string | null;
  frequency: string;
  description: string;
  userId: string;
  category: string;
  location: string;
  split: "50/50" | "custom" | "100%";
  status?: "active" | "ended";
  createdAt?: string;
  linkedDocumentIds?: string[];
  /** Raw backend split value (same semantics as `split`). */
  splitType?: "50/50" | "custom" | "100%";
  /** The user who pays this recurring expense. */
  user?: { _id: string } | null;
}
