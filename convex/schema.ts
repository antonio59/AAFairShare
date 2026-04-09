import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    // Password auth fields
    passwordHash: v.optional(v.string()),
    passwordUpdatedAt: v.optional(v.number()),
    // Legacy fields for migration compatibility
    username: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("email", ["email"]),

  categories: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  }).index("by_name", ["name"]),

  locations: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  expenses: defineTable({
    amount: v.number(),
    date: v.string(),
    month: v.string(),
    description: v.optional(v.string()),
    paidById: v.id("users"),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    splitType: v.string(),
    linkedBillId: v.optional(v.id("bills")), // Link to a bill
    linkedReceiptIds: v.optional(v.array(v.id("receipts"))), // Link to multiple receipts/invoices
  })
    .index("by_month", ["month"])
    .index("by_date", ["date"])
    .index("by_paid_by", ["paidById"])
    .index("by_location", ["locationId"])
    .index("by_category", ["categoryId"])
    .index("by_linked_bill", ["linkedBillId"]),

  recurring: defineTable({
    amount: v.number(),
    nextDueDate: v.string(),
    endDate: v.optional(v.string()),
    frequency: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    categoryId: v.id("categories"),
    locationId: v.id("locations"),
    splitType: v.string(),
  })
    .index("by_next_due_date", ["nextDueDate"])
    .index("by_user", ["userId"]),

  settlements: defineTable({
    month: v.string(),
    date: v.string(),
    amount: v.number(),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.string(),
    recordedBy: v.id("users"),
  }).index("by_month", ["month"]),

  savingsGoals: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    icon: v.string(),
    targetDate: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.string()),
  }),

  savingsContributions: defineTable({
    goalId: v.id("savingsGoals"),
    amount: v.number(),
    contributorId: v.optional(v.id("users")),
    date: v.string(),
    note: v.optional(v.string()),
    // Legacy fields for backward compatibility
    user1Contribution: v.optional(v.number()),
    user2Contribution: v.optional(v.number()),
  }).index("by_goal", ["goalId"]),

  // Standalone receipts (not attached to expenses)
  receipts: defineTable({
    storageId: v.id("_storage"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.string(),
    notes: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
    linkedExpenseIds: v.optional(v.array(v.id("expenses"))), // Link to multiple expenses
  }).index("by_date", ["date"]),

  // Rate limiting for login attempts
  loginAttempts: defineTable({
    email: v.string(),
    attempts: v.number(),
    lastAttempt: v.number(),
    lockedUntil: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Pending transactions from bank integrations or automations
  pendingTransactions: defineTable({
    amount: v.number(),
    date: v.string(),
    merchantName: v.string(),
    description: v.optional(v.string()),
    source: v.string(), // "truelayer", "plaid", "applepay", "googlepay", "ifttt", "manual"
    externalId: v.optional(v.string()), // Bank transaction ID for deduplication
    suggestedCategoryId: v.optional(v.id("categories")),
    suggestedLocationId: v.optional(v.id("locations")),
    suggestedPaidById: v.optional(v.id("users")),
    status: v.string(), // "pending", "approved", "dismissed"
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    processedBy: v.optional(v.id("users")),
    expenseId: v.optional(v.id("expenses")), // Link to created expense
  })
    .index("by_status", ["status"])
    .index("by_external_id", ["externalId"])
    .index("by_created_at", ["createdAt"]),

  // Bank account links (TrueLayer / Plaid)
  bankLinks: defineTable({
    userId: v.id("users"),
    provider: v.string(), // "truelayer", "plaid"
    accessToken: v.string(), // Encrypted
    refreshToken: v.optional(v.string()),
    accountId: v.string(),
    accountName: v.string(),
    institutionName: v.string(),
    lastSyncAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"]),

  // Merchant category mappings for auto-categorization
  merchantMappings: defineTable({
    merchantPattern: v.string(), // Regex or contains match
    categoryId: v.id("categories"),
    locationId: v.optional(v.id("locations")),
    isUtility: v.boolean(), // Flag for auto-logging utilities
  }).index("by_pattern", ["merchantPattern"]),

  // Addresses for bill organization
  addresses: defineTable({
    name: v.string(), // e.g., "123 Main Street, London"
    isArchived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_archived", ["isArchived"]),

  // Bills (utility bills, council tax, etc.) tied to addresses
  bills: defineTable({
    storageId: v.id("_storage"),
    addressId: v.id("addresses"),
    filename: v.string(), // User-editable filename
    billType: v.optional(v.string()), // e.g., "electricity", "gas", "council-tax", "water", "internet", "receipt", "invoice"
    amount: v.optional(v.number()), // Total bill amount
    monthlyAmount: v.optional(v.number()), // For recurring bills like council tax
    billPeriod: v.optional(v.string()), // e.g., "Jan 2025 - Dec 2025" for annual bills
    billDate: v.optional(v.string()), // Date on the bill
    uploadDate: v.string(),
    uploadedBy: v.optional(v.id("users")),
    fileType: v.string(), // "pdf" or "image"
    isShared: v.optional(v.boolean()), // For sharing with partner
    linkedExpenseIds: v.optional(v.array(v.id("expenses"))), // Links to multiple expenses
  })
    .index("by_address", ["addressId"])
    .index("by_upload_date", ["uploadDate"]),
});
