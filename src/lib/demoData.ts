import { Expense, RecurringExpense, User } from "@/types";

const DEMO_USER_NAME = import.meta.env.VITE_DEMO_USER_NAME || "Alex";
const DEMO_PARTNER_NAME = import.meta.env.VITE_DEMO_PARTNER_NAME || "Jamie";
const DEMO_USER_EMAIL = import.meta.env.VITE_DEMO_USER_EMAIL || "you@example.com";
const DEMO_PARTNER_EMAIL = import.meta.env.VITE_DEMO_PARTNER_EMAIL || "partner@example.com";
const DEMO_USER_AVATAR = import.meta.env.VITE_DEMO_USER_AVATAR || "https://i.pravatar.cc/80?img=12";
const DEMO_PARTNER_AVATAR = import.meta.env.VITE_DEMO_PARTNER_AVATAR || "https://i.pravatar.cc/80?img=32";

export const DEMO_MODE = import.meta.env.VITE_GUEST_MODE === "true";

export const demoUsers: User[] = [
  { id: "user1", username: DEMO_USER_NAME, email: DEMO_USER_EMAIL, avatar: DEMO_USER_AVATAR },
  { id: "user2", username: DEMO_PARTNER_NAME, email: DEMO_PARTNER_EMAIL, avatar: DEMO_PARTNER_AVATAR },
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
    _id: "goal-1",
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
    contributorName: DEMO_USER_NAME,
    contributorImage: DEMO_USER_AVATAR,
    date: "2025-11-15",
    note: "Flight deposit",
  },
  {
    _id: "cont-2",
    goalId: "goal-1",
    amount: 450,
    contributorId: "user2",
    contributorName: DEMO_PARTNER_NAME,
    contributorImage: DEMO_PARTNER_AVATAR,
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
  user1Name: DEMO_USER_NAME,
  user2Name: DEMO_PARTNER_NAME,
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

export const demoAddresses = [
  {
    _id: "addr-1",
    name: "123 High Street, London SW1A 1AA",
    isArchived: false,
    billCount: 3,
  },
  {
    _id: "addr-2",
    name: "45 Park Avenue, Manchester M1 2AB",
    isArchived: true,
    billCount: 2,
  },
];

export const demoBills = [
  {
    _id: "bill-1",
    storageId: "storage-1",
    addressId: "addr-1",
    filename: "Council Tax 2025-2026",
    billType: "council-tax",
    amount: 1650,
    monthlyAmount: 137.5,
    billPeriod: "Apr 2025 - Mar 2026",
    billDate: "2025-04-01",
    uploadDate: "2025-04-05",
    fileType: "pdf",
    isShared: true,
    url: "https://example.com/bill1.pdf",
    linkedExpenseCount: 2,
    linkedExpenses: [
      { _id: "exp-bill-1", amount: 137.5, date: "2025-04-01", description: "Council Tax April", paidByName: DEMO_USER_NAME },
      { _id: "exp-bill-2", amount: 137.5, date: "2025-05-01", description: "Council Tax May", paidByName: DEMO_PARTNER_NAME },
    ],
    addressName: "123 High Street, London SW1A 1AA",
    uploadedByName: DEMO_USER_NAME,
    uploadedByImage: demoUsers[0].avatar || "",
  },
  {
    _id: "bill-2",
    storageId: "storage-2",
    addressId: "addr-1",
    filename: "British Gas - March 2025",
    billType: "gas",
    amount: 85.5,
    billDate: "2025-03-15",
    uploadDate: "2025-03-20",
    fileType: "image",
    isShared: false,
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
    linkedExpenseCount: 1,
    linkedExpenses: [
      { _id: "exp-bill-3", amount: 85.5, date: "2025-03-20", description: "Gas bill payment", paidByName: DEMO_USER_NAME },
    ],
    addressName: "123 High Street, London SW1A 1AA",
    uploadedByName: DEMO_USER_NAME,
    uploadedByImage: demoUsers[0].avatar || "",
  },
  {
    _id: "bill-3",
    storageId: "storage-3",
    addressId: "addr-1",
    filename: "Sky Broadband Invoice",
    billType: "internet",
    amount: 45,
    monthlyAmount: 45,
    billDate: "2025-04-01",
    uploadDate: "2025-04-02",
    fileType: "pdf",
    isShared: true,
    url: "https://example.com/bill3.pdf",
    linkedExpenseCount: 0,
    linkedExpenses: [],
    addressName: "123 High Street, London SW1A 1AA",
    uploadedByName: DEMO_PARTNER_NAME,
    uploadedByImage: demoUsers[1].avatar || "",
  },
];
