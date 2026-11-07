# Database Schema

> Convex database schema documentation

## Overview

AAFairShare uses Convex as its database, which provides:

- Real-time synchronization
- Automatic TypeScript types
- ACID transactions
- Indexed queries

## Schema Definition

Located in `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Application tables defined below
});
```

## Tables

### users

Stores user account information. The household is fixed at two people: the first two users by creation time are user1 and user2 in every balance. No function deletes a user or their `authAccounts` row; every mutation is built from `convex/utils/functions.ts`, whose database refuses those deletes.

| Field          | Type        | Description              |
| -------------- | ----------- | ------------------------ |
| `_id`          | Id<"users"> | Auto-generated unique ID |
| `email`        | string      | User's email (unique)    |
| `name`         | string?     | Display name             |
| `username`     | string?     | Unique username          |
| `image`        | string?     | Avatar URL               |
| `photoUrl`     | string?     | Legacy avatar field      |
| `passwordHash` | string?     | Bcrypt hashed password   |

**Indexes:**

- `by_email` - For login lookups

### expenses

Stores individual expense records.

| Field         | Type             | Description                  |
| ------------- | ---------------- | ---------------------------- |
| `_id`         | Id<"expenses">   | Auto-generated unique ID     |
| `amount`      | number           | Expense amount               |
| `date`        | string           | Date in YYYY-MM-DD format    |
| `month`       | string           | Month in YYYY-MM format      |
| `description` | string?          | Optional notes               |
| `paidById`    | Id<"users">      | Who paid                     |
| `categoryId`  | Id<"categories"> | Expense category             |
| `locationId`  | Id<"locations">  | Where spent                  |
| `splitType`   | string           | "50/50", "custom", or "100%" |
| `receiptId`   | Id<"\_storage">? | Attached receipt             |

**Indexes:**

- `by_month` - For monthly queries
- `by_paidBy` - For user-specific queries
- `by_category` - For category filtering

### categories

Expense categories.

| Field  | Type             | Description              |
| ------ | ---------------- | ------------------------ |
| `_id`   | Id<"categories"> | Auto-generated unique ID |
| `name`  | string           | Category name (unique)   |
| `group` | string?          | `"household-bills"` lets its 50/50 expenses use a refund credit |

**Indexes:**

- `by_name` - For name lookups

### locations

Expense locations.

| Field  | Type            | Description              |
| ------ | --------------- | ------------------------ |
| `_id`  | Id<"locations"> | Auto-generated unique ID |
| `name` | string          | Location name (unique)   |

**Indexes:**

- `by_name` - For name lookups

### recurring

Recurring expense templates.

| Field         | Type             | Description                   |
| ------------- | ---------------- | ----------------------------- |
| `_id`         | Id<"recurring">  | Auto-generated unique ID      |
| `amount`      | number           | Expense amount                |
| `nextDueDate` | string           | Next due date (YYYY-MM-DD)    |
| `endDate`     | string?          | Optional end date             |
| `frequency`   | string           | "weekly", "monthly", "yearly" |
| `description` | string?          | Optional notes                |
| `userId`      | Id<"users">      | Responsible user              |
| `categoryId`  | Id<"categories"> | Category                      |
| `locationId`  | Id<"locations">  | Location                      |
| `splitType`   | string           | Split type                    |

**Indexes:**

- `by_next_due_date` - For due date queries
- `by_user` - For user filtering

### settlements

Monthly settlement records.

| Field        | Type              | Description              |
| ------------ | ----------------- | ------------------------ |
| `_id`        | Id<"settlements"> | Auto-generated unique ID |
| `month`      | string            | Month (YYYY-MM format)   |
| `fromUserId` | Id<"users">       | Who paid                 |
| `toUserId`   | Id<"users">       | Who received             |
| `amount`     | number            | Settlement amount        |
| `status`     | string            | "pending" or "completed" |
| `settledAt`  | number?           | Timestamp when settled   |

**Indexes:**

- `by_month` - For monthly queries

### credits

Money one person received for both of them, such as a supplier refund. Half belongs to the other person. What is left is `amount` minus the allocations and is never stored.

| Field        | Type          | Description                                         |
| ------------ | ------------- | --------------------------------------------------- |
| `amount`     | number        | £, rounded to pence                                 |
| `receivedOn` | string        | YYYY-MM-DD; only bills on or after this can draw on it |
| `holderId`   | Id<"users">   | Who holds the money; one of the two household users |
| `description`| string?       | e.g. "Energy refund"                                |
| `closedAt`   | number?       | Set to stop new draws; the remainder still shows as held |
| `createdBy`  | Id<"users">   | Who recorded it                                     |

**Indexes:** `by_received_on`

### creditAllocations

One draw on a credit, either onto a household bill (`kind: "bill"`) or as a cash-out into a month (`kind: "payout"`). Each draw adds `adjustment` to what the holder owes the other person in `month`. The adjustment is fixed when the draw is written (half of the running total drawn, minus what earlier draws recorded), so releasing one draw never moves a settled month, and a fully drawn credit always adds up to exactly half its amount. Draws in settled months cannot be changed.

| Field        | Type               | Description                                  |
| ------------ | ------------------ | -------------------------------------------- |
| `creditId`   | Id<"credits">      | The credit drawn on                          |
| `kind`       | string             | `"bill"` or `"payout"`                       |
| `expenseId`  | Id<"expenses">?    | The bill, for `kind: "bill"`                 |
| `month`      | string             | The bill's month, or the payout month        |
| `amount`     | number             | £ drawn                                      |
| `adjustment` | number             | £ added to what the holder owes              |
| `createdBy`  | Id<"users">?       | Who made the draw                            |

**Indexes:** `by_credit`, `by_expense`, `by_month`

### savingsGoals

Shared savings goals.

| Field           | Type               | Description              |
| --------------- | ------------------ | ------------------------ |
| `_id`           | Id<"savingsGoals"> | Auto-generated unique ID |
| `name`          | string             | Goal name                |
| `targetAmount`  | number             | Target to save           |
| `currentAmount` | number             | Amount saved             |
| `icon`          | string             | Icon identifier          |
| `targetDate`    | string?            | Target completion date   |
| `isCompleted`   | boolean            | Completion status        |
| `completedAt`   | number?            | Completion timestamp     |

### savingsContributions

Contributions to savings goals.

| Field           | Type                       | Description              |
| --------------- | -------------------------- | ------------------------ |
| `_id`           | Id<"savingsContributions"> | Auto-generated unique ID |
| `goalId`        | Id<"savingsGoals">         | Parent goal              |
| `amount`        | number                     | Contribution amount      |
| `date`          | string                     | Contribution date        |
| `contributorId` | Id<"users">?               | Who contributed          |
| `note`          | string?                    | Optional note            |

**Indexes:**

- `by_goal` - For goal-specific queries

### receipts

Standalone receipt storage.

| Field        | Type            | Description              |
| ------------ | --------------- | ------------------------ |
| `_id`        | Id<"receipts">  | Auto-generated unique ID |
| `storageId`  | Id<"\_storage"> | File storage reference   |
| `title`      | string?         | Receipt title            |
| `amount`     | number?         | Receipt amount           |
| `date`       | string          | Receipt date             |
| `notes`      | string?         | Optional notes           |
| `uploadedBy` | Id<"users">?    | Uploader                 |

**Indexes:**

- `by_date` - For date sorting

### loginAttempts

Rate limiting for login security.

| Field         | Type                | Description              |
| ------------- | ------------------- | ------------------------ |
| `_id`         | Id<"loginAttempts"> | Auto-generated unique ID |
| `email`       | string              | Email being attempted    |
| `attempts`    | number              | Number of attempts       |
| `lastAttempt` | number              | Last attempt timestamp   |
| `lockedUntil` | number?             | Lockout expiry           |

**Indexes:**

- `by_email` - For email lookups

## Relationships

```
users ─────────────┬─────────────────────────────────────┐
                   │                                     │
                   ▼                                     ▼
              expenses ◄──────── categories         settlements
                   │
                   ▼
              locations

              recurring ◄──────── categories
                   │
                   ▼
              locations

         savingsGoals ◄──────── savingsContributions
```

## Query Patterns

### Get expenses by month

```typescript
ctx.db
  .query("expenses")
  .withIndex("by_month", (q) => q.eq("month", "2024-01"))
  .collect();
```

### Get user's recurring expenses

```typescript
ctx.db
  .query("recurring")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();
```

### Get contributions for a goal

```typescript
ctx.db
  .query("savingsContributions")
  .withIndex("by_goal", (q) => q.eq("goalId", goalId))
  .collect();
```

## Best Practices

1. **Always use indexes** for filtered queries
2. **Batch fetch related data** to avoid N+1 queries
3. **Validate inputs** before database operations
4. **Use transactions** for multi-table updates

## Next Steps

- [Authentication](./authentication.md) - Auth implementation
- [API Reference](../api/README.md) - Convex functions
