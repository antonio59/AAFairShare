# AGENTS (src)

## Package Identity
- React 18 + Vite SPA handling all client features (dashboard, analytics, receipts, recurring, savings).
- UI built with Tailwind + Radix/shadcn components; data via TanStack Query talking to Convex.

## Setup & Run
- Dev frontend: `bun run dev` (port 8080); keep backend running with `bun run dev:convex` and set `VITE_CONVEX_URL`.
- Env flags: `.env` supports `VITE_CONVEX_URL` and optional `VITE_GUEST_MODE=true` (forces demo data, disables uploads) plus demo name/email/avatar overrides in `src/lib/demoData.ts`.
- Build: `bun run build`; Preview: `bun run preview`.
- Lint: `bun run lint`; Typecheck: `bunx --bun tsc --noEmit`.
- Tests: `bun test` (few tests present; colocate new tests with features).

## Patterns & Conventions
- Routing lives in `src/App.tsx`; add new pages under `src/pages/*` and wire them into `<Routes>`.
- Data access should go through `src/hooks/useConvexData.ts` (handles Convex API types and demo mode). Example: `src/pages/AddExpense.tsx` uses `useAddExpenseWithLookup` and `Id` types.
- Auth: wrap UI with `AuthProvider` (`src/providers/NewAuthProvider.tsx`) and consume via `useAuth` (`src/providers/AuthContext.ts`); avoid calling Convex hooks before `isAuthenticated` is true.
- Layout: reuse shell components from `src/components/layout/AppLayout.tsx` plus `Sidebar.tsx`/`BottomNavigationBar.tsx`; share action buttons with `FloatingActionButton.tsx`.
- UI primitives come from `src/components/ui/*` (shadcn). Follow patterns in `src/components/expense/*` for form controls (`AmountInput.tsx`, `CategorySelector.tsx`, `ReceiptUpload.tsx`).
- Styling: Tailwind utilities with theme tokens from `src/index.css`/`tailwind.config.ts`; theme toggle via `ThemeProvider.tsx`.
- Exports/reports: use `src/services/export/*` (CSV, PDF, settlement) instead of ad-hoc implementations.
- Analytics/month helpers: prefer `src/hooks/useAnalytics.ts` and `src/services/utils/dateUtils.ts` for month math/formatting.
- ✅ DO fetch via `useQuery`/`useMutation` wrappers in `useConvexData.ts` and respect `DEMO_MODE` guard.
- ✅ DO guard user context (check `isAuthenticated` and handle loading) as in `src/providers/NewAuthProvider.tsx`.
- ❌ DON'T bypass demo safeguards (e.g., `ReceiptUpload.tsx` blocks uploads in demo mode) or mix raw IDs without `Id<...>` casts.

## Touch Points / Key Files
- Routing & entry: `src/App.tsx`, `src/main.tsx`
- Layout & navigation: `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `BottomNavigationBar.tsx`
- Data hooks: `src/hooks/useConvexData.ts`, `src/hooks/useAnalytics.ts`
- Providers: `src/providers/NewAuthProvider.tsx`, `AuthContext.ts`, `ThemeProvider.tsx`
- Feature pages: `src/pages/Dashboard.tsx`, `Analytics.tsx`, `AddExpense.tsx`, `SavingsGoals.tsx`, `Receipts.tsx`, `Recurring.tsx`, `Settings.tsx`, `Landing.tsx`
- Utilities/exports: `src/services/export/*`, `src/lib/demoData.ts`, `src/lib/version.ts`

## JIT Index Hints
- Find pages/components: `find src/pages -name "*.tsx" -maxdepth 1` and `find src/components -name "*.tsx" -maxdepth 2`
- Locate Convex hook usage: `grep -R "useMutation(" src/hooks src/pages`
- Search demo-mode guards: `grep -R "DEMO_MODE" src`
- List UI primitives: `ls src/components/ui`
- Types and helpers: `find src/types -name "*.ts"`

## Common Gotchas
- Run Convex dev server or Convex queries will return `undefined` during local dev.
- `VITE_CONVEX_URL` must be set; otherwise it falls back to a production URL in `App.tsx`.
- `VITE_GUEST_MODE=true` disables uploads and uses canned demo data; ensure you’re in the right mode before testing flows.
- Respect Convex `Id` typing when passing identifiers (see casts in `AddExpense.tsx`).
- Receipt uploads reject non-images and files >5MB (`ReceiptUpload.tsx`).

## Pre-PR Checks
- `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build`
