import { Expense } from '@/types';

export interface TestEmailConfig {
  year: number;
  month: number;
  settlementAmount: number;
  settlementDirection: "owes" | "owed" | "even";
}

export interface EmailSendingResult {
  success: boolean;
  message?: string;
  errorMessage?: string;
  errorTrace?: string;
}

export interface EmailTestData {
  testYear: number;
  testMonth: number;
  sampleMonthData: {
    totalExpenses: number;
    user1Paid: number;
    user2Paid: number;
    settlement: number;
    settlementDirection: "owes" | "owed" | "even";
    expenses: Expense[];
  };
}
