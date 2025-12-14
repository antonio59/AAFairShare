# API Reference

> Convex functions and data models

## Overview

AAFairShare uses Convex for its backend API. All functions are type-safe and provide real-time updates.

## Function Types

| Type         | Description                 | Use                         |
| ------------ | --------------------------- | --------------------------- |
| **Query**    | Read-only, cached           | Fetching data               |
| **Mutation** | Write operations            | Creating/updating/deleting  |
| **Action**   | External calls, complex ops | File uploads, external APIs |
| **Internal** | Server-only functions       | Background tasks            |

## Authentication

All API calls require authentication. Use the `requireAuthenticatedUser` helper:

```typescript
import { requireAuthenticatedUser } from "./utils/auth";

export const myQuery = query({
  handler: async (ctx) => {
    const user = await requireAuthenticatedUser(ctx);
    // ... rest of handler
  },
});
```

---

## Expenses API

### Queries

#### `expenses.getByMonth`

Get all expenses for a specific month.

```typescript
// Arguments
{
  month: string;
} // Format: "YYYY-MM"

// Returns
Array<{
  _id: Id<"expenses">;
  amount: number;
  date: string;
  category: string;
  location: string;
  paidByUser: User;
  // ...
}>;
```

#### `expenses.getById`

Get a single expense by ID.

```typescript
// Arguments
{
  id: Id<"expenses">;
}

// Returns
Expense | null;
```

### Mutations

#### `expenses.create`

Create a new expense.

```typescript
// Arguments
{
  amount: number;
  date: string;       // "YYYY-MM-DD"
  month: string;      // "YYYY-MM"
  description?: string;
  paidById: Id<"users">;
  categoryId: Id<"categories">;
  locationId: Id<"locations">;
  splitType: "50/50" | "custom" | "100%";
}

// Returns
Id<"expenses">
```

#### `expenses.update`

Update an existing expense.

```typescript
// Arguments
{
  id: Id<"expenses">;
  amount?: number;
  date?: string;
  description?: string;
  // ... other optional fields
}
```

#### `expenses.delete`

Delete an expense.

```typescript
// Arguments
{
  id: Id<"expenses">;
}
```

---

## Categories API

### Queries

#### `categories.getAll`

Get all categories.

```typescript
// Returns
Array<{ _id: Id<"categories">; name: string }>;
```

### Mutations

#### `categories.create`

Create a new category.

```typescript
// Arguments
{
  name: string;
}

// Returns
Id<"categories">;
```

---

## Locations API

### Queries

#### `locations.getAll`

Get all locations.

```typescript
// Returns
Array<{ _id: Id<"locations">; name: string }>;
```

### Mutations

#### `locations.create`

Create a new location.

```typescript
// Arguments
{
  name: string;
}

// Returns
Id<"locations">;
```

---

## Users API

### Queries

#### `users.getAll`

Get all users (limited fields).

```typescript
// Returns
Array<{
  _id: Id<"users">;
  name?: string;
  username?: string;
  email?: string;
  image?: string;
}>;
```

#### `users.current`

Get the current authenticated user.

```typescript
// Returns
User | null;
```

---

## Recurring API

### Queries

#### `recurring.getAll`

Get all recurring expenses.

```typescript
// Returns
Array<RecurringExpense>;
```

### Mutations

#### `recurring.create`

Create a recurring expense.

```typescript
// Arguments
{
  amount: number;
  nextDueDate: string;
  endDate?: string;
  frequency: "weekly" | "monthly" | "yearly";
  categoryName: string;
  locationName: string;
  splitType: string;
  userId: Id<"users">;
  description?: string;
}
```

#### `recurring.generateExpense`

Generate an actual expense from a recurring template.

```typescript
// Arguments
{
  id: Id<"recurring">;
}

// Returns
Id<"expenses">;
```

---

## Settlements API

### Queries

#### `settlements.getAll`

Get all settlements.

#### `settlements.getByMonth`

Get settlement for a specific month.

### Mutations

#### `settlements.create`

Create a settlement record.

#### `settlements.markUnsettled`

Undo a settlement.

---

## Savings Goals API

### Queries

#### `savingsGoals.getAll`

Get all savings goals with progress.

#### `savingsGoals.getContributions`

Get contributions for a goal.

### Mutations

#### `savingsGoals.create`

Create a new savings goal.

#### `savingsGoals.addContribution`

Add a contribution to a goal.

#### `savingsGoals.markComplete`

Mark a goal as completed.

---

## Analytics API

### Queries

#### `analytics.getMonthlyData`

Get analytics for a month.

```typescript
// Arguments
{
  month: string;
}

// Returns
{
  totalExpenses: number;
  categoryBreakdown: Array<{ name: string; value: number }>;
  locationBreakdown: Array<{ name: string; value: number }>;
  userBreakdown: Array<{ name: string; value: number }>;
  // ...
}
```

---

## Month Data API

### Queries

#### `monthData.getMonthData`

Get comprehensive month data for dashboard.

```typescript
// Arguments
{
  month: string;
}

// Returns
{
  expenses: Array<Expense>;
  users: Array<User>;
  totalExpenses: number;
  user1Paid: number;
  user2Paid: number;
  settlementAmount: number;
  settlementDirection: string;
  // ...
}
```

---

## Validation

All mutations validate inputs using helpers from `convex/utils/validation.ts`:

```typescript
import {
  assertValidMonth,
  assertValidDate,
  assertPositiveAmount,
  assertValidSplitType,
  assertValidFrequency,
} from "./utils/validation";
```

---

## Error Handling

Convex functions throw errors that are caught by the client:

```typescript
// In mutation
if (!user) {
  throw new Error("User not found");
}

// In component
try {
  await createExpense(data);
} catch (error) {
  toast({ title: "Error", description: error.message });
}
```

---

## React Hooks

Use the hooks in `src/hooks/useConvexData.ts`:

```typescript
// Queries
const expenses = useExpenses(month);
const users = useUsers();
const categories = useCategories();

// Mutations
const addExpense = useAddExpense();
const deleteExpense = useDeleteExpense();
```

---

## Next Steps

- [Mutations Reference](./mutations.md)
- [Queries Reference](./queries.md)
- [Types Reference](./types.md)
