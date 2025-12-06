import { Expense, RecurringExpense, User } from "@/types";

export const DEMO_MODE = import.meta.env.VITE_GUEST_MODE === "true";

export const demoUsers: User[] = [
  { id: "user1", username: "Alex", email: "alex@example.com", avatar: "https://i.pravatar.cc/80?img=12" },
  { id: "user2", username: "Jamie", email: "jamie@example.com", avatar: "https://i.pravatar.cc/80?img=32" },
];

export const demoCategories = [
  { id: "cat-groceries", name: "Groceries" },
  { id: "cat-utilities", name: "Utilities" },
  { id: "cat-entertainment", name: "Entertainment" },
];

export const demoLocations = [
  { id: "loc-tesco", name: "Tesco" },
  { id: "loc-home", name: "Home" },
  { id: "loc-cinema", name: "Cinema" },
];

export const demoExpenses: Expense[] = [
  {
    id: "exp-1",
    description: "Groceries",
    amount: 42.5,
    date: "2025-12-02",
    category: "Groceries",
    location: "Tesco",
    paidBy: "user1",
    split: "50/50",
  },
  {
    id: "exp-2",
    description: "Electric bill",
    amount: 120,
    date: "2025-12-01",
    category: "Utilities",
    location: "Home",
    paidBy: "user2",
    split: "50/50",
  },
  {
    id: "exp-3",
    description: "Movie night",
    amount: 28,
    date: "2025-12-03",
    category: "Entertainment",
    location: "Cinema",
    paidBy: "user1",
    split: "50/50",
  },
];

export const demoRecurring: RecurringExpense[] = [
  {
    id: "rec-1",
    amount: 1200,
    nextDueDate: "2025-12-28",
    frequency: "monthly",
    description: "Rent",
    userId: "user2",
    category: "Housing",
    location: "Landlord",
    split: "50/50",
    status: "active",
  },
  {
    id: "rec-2",
    amount: 15.99,
    nextDueDate: "2025-12-10",
    frequency: "monthly",
    description: "Netflix",
    userId: "user1",
    category: "Entertainment",
    location: "Netflix",
    split: "50/50",
    status: "active",
  },
];

export const demoSavingsGoals = [
  {
    id: "goal-1",
    name: "Holiday Fund",
    targetAmount: 2000,
    currentAmount: 950,
    icon: "plane",
    targetDate: "2026-06-01",
    isCompleted: false,
  },
];

export const demoSavingsContributions = [
  {
    _id: "cont-1",
    goalId: "goal-1",
    amount: 500,
    contributorId: "user1",
    date: "2025-11-15",
    note: "Flight deposit",
  },
  {
    _id: "cont-2",
    goalId: "goal-1",
    amount: 450,
    contributorId: "user2",
    date: "2025-11-20",
    note: "Hotel booking",
  },
];

export const demoSettlements = [
  {
    _id: "set-1",
    month: "2025-11",
    date: "2025-11-30",
    amount: 75.5,
    fromUserId: "user1",
    toUserId: "user2",
    status: "completed",
    recordedBy: "user1",
  },
];

export const demoReceipts = [
  {
    _id: "rec-standalone-1",
    type: "standalone" as const,
    title: "Grocery receipt",
    amount: 42.5,
    date: "2025-12-02",
    notes: "Weekly shop",
    receiptUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
    uploadedByName: "Alex",
    uploadedByImage: demoUsers[0].avatar || "",
  },
  {
    _id: "rec-expense-1",
    type: "expense" as const,
    amount: 120,
    date: "2025-12-01",
    category: "Utilities",
    location: "Home",
    description: "Electric bill",
    paidByName: "Jamie",
    paidByImage: demoUsers[1].avatar || "",
    receiptUrl: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=400&q=80",
  },
];

export const demoMonthData = {
  totalExpenses: demoExpenses.reduce((s, e) => s + e.amount, 0),
  fairShare: demoExpenses.reduce((s, e) => s + e.amount, 0) / 2,
  settlement: 45.5,
  settlementDirection: "owes" as const,
  user1Paid: demoExpenses.filter(e => e.paidBy === "user1").reduce((s, e) => s + e.amount, 0),
  user2Paid: demoExpenses.filter(e => e.paidBy === "user2").reduce((s, e) => s + e.amount, 0),
  user1Name: "Alex",
  user2Name: "Jamie",
  user1Id: "user1",
  user2Id: "user2",
  expenses: demoExpenses,
};

export const demoAnalytics = {
  total: demoExpenses.reduce((s, e) => s + e.amount, 0),
  count: demoExpenses.length,
  average: demoExpenses.reduce((s, e) => s + e.amount, 0) / demoExpenses.length,
  periodTotal: demoExpenses.reduce((s, e) => s + e.amount, 0),
  periodCount: demoExpenses.length,
};
