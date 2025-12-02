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
  })
    .index("by_month", ["month"])
    .index("by_date", ["date"])
    .index("by_paid_by", ["paidById"]),

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
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.string()),
  }),

  savingsContributions: defineTable({
    goalId: v.id("savingsGoals"),
    amount: v.number(),
    user1Contribution: v.number(),
    user2Contribution: v.number(),
    date: v.string(),
    note: v.optional(v.string()),
  }).index("by_goal", ["goalId"]),
});
