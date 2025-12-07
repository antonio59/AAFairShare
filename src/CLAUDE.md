# CLAUDE (src) – Frontend SPA

## Package Identity
- **Purpose:** React frontend for AAFairShare (dashboard, analytics, receipts, recurring, savings, settlements)
- **Tech:** React 18, TypeScript (non-strict), React Router, TanStack Query, Tailwind + Radix/shadcn UI
- **Entry:** `src/main.tsx` → `src/App.tsx`; routes/pages under `src/pages/`
- **Parent:** Extends [../CLAUDE.md](../CLAUDE.md)

## Setup & Commands
- Dev server: `bun run dev` (port 8080)
- Backend dev alongside: `bun run dev:convex`
- Lint: `bun run lint`
- Typecheck: `bunx --bun tsc --noEmit`
- Tests: `bun test` (add colocated tests)
- Build: `bun run build`; Preview: `bun run preview`
- Pre-PR (frontend scope): `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build`

## Architecture & Patterns (DO/DO NOT)
- **Routing:** Define routes in `src/App.tsx`; page components live in `src/pages/*`.
- **Data access:** ✅ Use hooks in `src/hooks/useConvexData.ts` (e.g., `useAddExpenseWithLookup` in `src/pages/AddExpense.tsx`). ❌ Do not call Convex directly in components or bypass hooks.
- **Auth:** Wrap UI with `AuthProvider` (`src/providers/NewAuthProvider.tsx`); consume via `useAuth` (`src/providers/AuthContext.ts`). Ensure `isAuthenticated` is respected before firing queries.
- **Layout:** Reuse shell components in `src/components/layout/*` (`AppLayout.tsx`, `Sidebar.tsx`, `BottomNavigationBar.tsx`, `FloatingActionButton.tsx`).
- **UI primitives:** Prefer shadcn components in `src/components/ui/*`; follow patterns in `src/components/expense/*` for form controls (`AmountInput.tsx`, `CategorySelector.tsx`, `ReceiptUpload.tsx`).
- **Styling:** Tailwind utility-first; theme tokens from `tailwind.config.ts` and `src/index.css`. Avoid inline styles unless necessary.
- **Demo mode:** `src/lib/demoData.ts` controls `DEMO_MODE`; components like `ReceiptUpload.tsx` disable uploads when true—do not remove guards.
- **Validation:** Use existing selectors and input components to enforce UX constraints; ensure date/month strings match backend expectations.
- **State & query:** Keep React Query defaults in `App.tsx` (retry=1, staleTime=5m, no refetch on focus) unless justified.
- **Types:** Shared types in `src/types/index.ts`; avoid `any`. Cast Convex IDs with `Id<...>` as in `AddExpense.tsx`.

## Key Files & Touch Points
- Entry/routing: `src/main.tsx`, `src/App.tsx`
- Providers: `src/providers/NewAuthProvider.tsx`, `AuthContext.ts`, `ThemeProvider.tsx`
- Data hooks: `src/hooks/useConvexData.ts`, `src/hooks/useAnalytics.ts`
- Layout/navigation: `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `BottomNavigationBar.tsx`
- Feature pages: `src/pages/Dashboard.tsx`, `Analytics.tsx`, `AddExpense.tsx`, `SavingsGoals.tsx`, `Receipts.tsx`, `Recurring.tsx`, `Settings.tsx`, `Landing.tsx`
- Utilities: `src/lib/demoData.ts`, `src/lib/version.ts`, `src/services/export/*`, `src/services/utils/dateUtils.ts`

## JIT Search Hints
- Pages: `find src/pages -name "*.tsx"`
- Layout/components: `find src/components -name "*.tsx" -maxdepth 2`
- Convex hook usage: `grep -R "useConvexData" -n src`
- Demo mode references: `grep -R "DEMO_MODE" -n src`
- Types: `find src/types -name "*.ts"`

## Common Gotchas
- `App.tsx` falls back to a production Convex URL if `VITE_CONVEX_URL` is missing—set it in `.env` for local dev.
- `DEMO_MODE` disables uploads and forces mock data; verify mode before testing flows.
- Receipt uploads enforce image type and 5MB limit (`src/components/expense/ReceiptUpload.tsx`).
- Respect `Id` typing when passing identifiers to Convex mutations.

## Testing Guidelines
- Use `bun test`; add colocated `*.test.tsx` for components and hooks.
- Mock Convex via `DEMO_MODE` or stub hooks rather than hitting real backend.
- Prefer behavior-driven tests (user interactions, render states) over implementation details.

## Pre-PR Checklist (frontend scope)
- `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build`
- Confirm routes registered in `src/App.tsx` and data flows via `useConvexData`.
