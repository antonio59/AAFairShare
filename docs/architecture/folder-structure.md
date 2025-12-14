# Folder Structure

> Project organization and file layout

## Root Directory

```
AAFairShare/
├── .claude/                # Claude AI configuration
│   └── commands/           # Custom Claude commands
├── .github/                # GitHub configuration
│   └── workflows/          # CI/CD pipelines
├── convex/                 # Backend (Convex functions)
├── docs/                   # Documentation (this folder)
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/                    # Frontend source code
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite build config
└── README.md               # Project readme
```

## Convex Backend (`convex/`)

```
convex/
├── _generated/             # Auto-generated types (don't edit)
│   ├── api.d.ts
│   ├── dataModel.d.ts
│   └── server.d.ts
├── utils/                  # Shared utilities
│   ├── auth.ts             # Auth helper functions
│   ├── batchFetch.ts       # Batch query utilities
│   ├── password.ts         # Password hashing
│   ├── rateLimit.ts        # Rate limiting
│   └── validation.ts       # Input validation
├── analytics.ts            # Analytics queries
├── auth.config.ts          # Auth configuration
├── auth.ts                 # Authentication setup
├── categories.ts           # Category CRUD
├── expenses.ts             # Expense CRUD
├── http.ts                 # HTTP routes
├── locations.ts            # Location CRUD
├── monthData.ts            # Monthly aggregations
├── password.ts             # Password mutations
├── receipts.ts             # Receipt management
├── recurring.ts            # Recurring expenses
├── savingsGoals.ts         # Savings goals
├── schema.ts               # Database schema
├── settlements.ts          # Settlement tracking
└── users.ts                # User management
```

## Frontend Source (`src/`)

```
src/
├── components/             # React components
│   ├── analytics/          # Analytics visualizations
│   │   ├── AnalyticsCharts.tsx
│   │   ├── MonthlyPieChart.tsx
│   │   └── ...
│   ├── dashboard/          # Dashboard components
│   │   ├── expense-row/
│   │   ├── ExpensesTable.tsx
│   │   └── ...
│   ├── expense/            # Expense form components
│   │   ├── AmountInput.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── DateSelector.tsx
│   │   ├── LocationSelector.tsx
│   │   ├── SplitTypeSelector.tsx
│   │   └── ReceiptUpload.tsx
│   ├── layout/             # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── BottomNavigationBar.tsx
│   ├── recurring/          # Recurring expense components
│   ├── savings/            # Savings goal components
│   ├── settlement/         # Settlement components
│   ├── ui/                 # shadcn/ui base components
│   ├── ErrorBoundary.tsx
│   └── KeyboardShortcutsModal.tsx
├── hooks/                  # Custom React hooks
│   ├── use-mobile.tsx      # Mobile detection
│   ├── use-toast.ts        # Toast notifications
│   ├── useAnalytics.ts     # Analytics hook
│   ├── useConvexData.ts    # Convex data hooks
│   └── useKeyboardShortcuts.ts
├── lib/                    # Utilities
│   ├── demoData.ts         # Demo mode data
│   ├── utils.ts            # Utility functions
│   └── version.ts          # Version info
├── pages/                  # Route components
│   ├── AddExpense.tsx
│   ├── Analytics.tsx
│   ├── Dashboard.tsx
│   ├── Index.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── Receipts.tsx
│   ├── Recurring.tsx
│   ├── SavingsGoals.tsx
│   ├── Settings.tsx
│   └── Settlement.tsx
├── providers/              # Context providers
│   ├── AuthContext.ts
│   ├── AuthProvider.tsx
│   ├── ThemeContext.ts
│   └── ThemeProvider.tsx
├── services/               # Business logic
│   ├── export/             # Export services
│   │   ├── csvExportService.ts
│   │   ├── pdfExportService.ts
│   │   └── settlementReportService.ts
│   └── utils/
│       └── dateUtils.ts
├── types/                  # TypeScript types
│   └── index.ts
├── App.tsx                 # Root component
├── App.css                 # Global styles
├── index.css               # Tailwind imports
├── main.tsx                # Entry point
└── vite-env.d.ts           # Vite types
```

## Documentation (`docs/`)

```
docs/
├── index.md                # Documentation hub
├── getting-started/        # Setup guides
│   ├── README.md
│   ├── installation.md
│   ├── configuration.md
│   └── first-steps.md
├── architecture/           # Technical docs
│   ├── README.md
│   ├── database-schema.md
│   └── folder-structure.md
├── features/               # Feature docs
│   └── README.md
├── api/                    # API reference
│   └── README.md
├── development/            # Dev guides
│   └── README.md
└── deployment/             # Deploy guides
    └── README.md
```

## Scripts (`scripts/`)

```
scripts/
├── set-password.ts         # Set user passwords
├── capture-screens.ts      # Screenshot automation
└── audit-user-links.ts     # Link auditing
```

## GitHub Configuration (`.github/`)

```
.github/
├── workflows/
│   ├── code-quality.yml    # Lint & typecheck
│   ├── codeql-analysis.yml # Security scanning
│   ├── dependency-review.yml
│   ├── netlify-deploy.yml  # Deploy frontend
│   └── npm-audit.yml       # Dependency audit
└── dependabot.yml          # Auto dependency updates
```

## Key Files

| File                 | Purpose                      |
| -------------------- | ---------------------------- |
| `package.json`       | Dependencies and npm scripts |
| `tsconfig.json`      | TypeScript configuration     |
| `vite.config.ts`     | Vite build configuration     |
| `tailwind.config.ts` | Tailwind CSS configuration   |
| `components.json`    | shadcn/ui configuration      |
| `eslint.config.js`   | ESLint rules                 |
| `netlify.toml`       | Netlify deployment config    |
| `convex/schema.ts`   | Database schema definition   |

## Naming Conventions

| Type             | Convention           | Example            |
| ---------------- | -------------------- | ------------------ |
| Components       | PascalCase           | `ExpenseTable.tsx` |
| Hooks            | camelCase with `use` | `useConvexData.ts` |
| Utils            | camelCase            | `dateUtils.ts`     |
| Types            | PascalCase           | `Expense`, `User`  |
| Convex functions | camelCase            | `expenses.ts`      |
| CSS classes      | kebab-case           | `expense-card`     |

## Import Aliases

The `@/` alias maps to `src/`:

```typescript
// Instead of:
import { Button } from "../../../components/ui/button";

// Use:
import { Button } from "@/components/ui/button";
```
