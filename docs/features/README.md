# Features Overview

> What AAFairShare does, as of version 3.5.0

AAFairShare is for one two-person household. Both people see and manage the same expenses, settlements and credits. Neither person, nor their sign-in, can be deleted from the app.

## Core Features

### Expense Tracking

Track daily expenses with amount, date, category, location, who paid and an optional receipt.

**Key Capabilities:**

- Add, edit and delete expenses
- Record who paid with the *Paid by* picker
- Categorise by type (Dining, Utilities, etc.) and tag with locations
- Attach receipts
- Split 50/50, or mark an expense as owed in full by the other person

### Recurring Expenses

Automate tracking for regular bills and subscriptions.

**Key Capabilities:**

- Monthly frequency, with an optional end date
- Due day kept across short months: a bill due on the 31st falls on the 28th in February and back on the 31st in March, using UK dates
- Generate the expense by hand, or let the daily run add it when it is due
- Track upcoming payments

### Settlement Tracking

Keep track of who owes whom and settle up each month.

**Key Capabilities:**

- Real-time balance, saying clearly who owes whom (or "All square")
- Worked out in whole pence
- Month breakdown explaining every amount
- One-click settlement, settlement history and undo
- Settlement email

### Shared Refund Credits

Share a refund on a household bill (for example an energy rebate) fairly.

**Key Capabilities:**

- Mark categories as household bills in Settings → Categories
- Record the refund amount, date received and who holds it on the Settlement page
- New household bills use credit automatically, oldest credit first
- Use on open bills, stop on a bill, pause for new bills, or cash out what is left
- Unused credit shown separately from what is owed; bill totals stay as the full amounts paid
- Settled months can't be changed by credit

[Learn more →](./refund-credits.md)

### Activity Feed

A chat-style feed of who added, changed or settled what, newest first, in UK time.

**Key Capabilities:**

- Search by description, person, category, place or amount
- Filter by Expenses, Settlements, Documents, Goals or Refunds
- Includes automatic actions, such as credit used on a new bill

### Savings Goals

Track shared savings towards common goals.

**Key Capabilities:**

- Create joint goals
- Track contributions by person
- Milestone celebrations
- Target date tracking
- Progress visualisation

### Analytics

Understand spending patterns with visual analytics.

**Key Capabilities:**

- Category breakdown
- Location analysis
- Monthly trends
- Person comparison
- Year-end summary

### Documents

Store receipts, bills, warranties, insurance, certificates and invoices.

**Key Capabilities:**

- Upload PDFs or images, standalone or attached to an expense
- Tags, expiry dates and version history
- Search, filter and bulk actions
- Secure storage

---

## Feature Matrix

| Feature        | Mobile | Desktop | Real-time |
| -------------- | ------ | ------- | --------- |
| Add Expense    | ✅     | ✅      | ✅        |
| Edit Expense   | ✅     | ✅      | ✅        |
| Delete Expense | ✅     | ✅      | ✅        |
| Recurring      | ✅     | ✅      | ✅        |
| Settlement     | ✅     | ✅      | ✅        |
| Refund Credits | ✅     | ✅      | ✅        |
| Activity Feed  | ✅     | ✅      | ✅        |
| Savings Goals  | ✅     | ✅      | ✅        |
| Analytics      | ✅     | ✅      | ✅        |
| Documents      | ✅     | ✅      | ✅        |
| Export PDF     | ⚠️     | ✅      | N/A       |
| Export CSV     | ⚠️     | ✅      | N/A       |

✅ Full support | ⚠️ Limited support | ❌ Not available

---

## User Interface

### Desktop Layout

- Sidebar navigation
- Full-width content area
- Keyboard shortcuts
- Multi-column layouts

### Mobile Layout

- Bottom navigation bar: Home, Settlement, Add expense (+), Analytics and More
- *More* opens Feed, Savings, Recurring, Documents and Settings
- Compact expense cards with an actions menu

### Themes

- **Light** - Default light theme
- **Dark** - Dark mode
- **High Contrast** - Accessibility-focused

---

## Keyboard Shortcuts

| Shortcut               | Action              |
| ---------------------- | ------------------- |
| `Cmd/Ctrl + N`         | New Expense         |
| `Cmd/Ctrl + H`         | Home/Dashboard      |
| `Cmd/Ctrl + Shift + F` | Feed                |
| `Cmd/Ctrl + S`         | Settlement          |
| `Cmd/Ctrl + A`         | Analytics           |
| `Cmd/Ctrl + R`         | Recurring           |
| `Cmd/Ctrl + G`         | Savings Goals       |
| `Cmd/Ctrl + ,`         | Settings            |
| `?`                    | Show shortcuts help |

---

## Data Categories

### Built-in Categories

- Dining
- Entertainment
- Gifts
- Groceries
- Health
- Holidays
- Moving
- Shopping
- Transport
- Utilities

More categories can be added in Settings → Categories, where each one can also be marked as a **Household bill** so it can use refund credit.

### Locations

Custom locations can be added on-the-fly when creating expenses.

---

## Split Types

| Type                    | Description                                   | Use Case                         |
| ----------------------- | --------------------------------------------- | -------------------------------- |
| **50/50**               | Split equally                                 | Shared expenses and bills        |
| **For [name] (100%)**   | The other person owes the payer the full amount | Something bought for the other person |

Only 50/50 expenses in a household-bill category can use refund credit.

---

## Real-time Sync

All data syncs in real-time across devices:

- Changes appear instantly
- No manual refresh needed
- Reconnects automatically

---

## Export Options

### PDF Reports

- Settlement summary
- Expense breakdown
- Monthly reports

### CSV Export

- Raw expense data
- Analytics data
- Compatible with Excel/Sheets

---

## Version History

See **Settings → About → Version History** in the app, or [CHANGELOG.md](../../CHANGELOG.md).

## Next Steps

- [Shared Refund Credits](./refund-credits.md) - Recording and using refunds
- [First Steps](../getting-started/first-steps.md) - Using the app for the first time
