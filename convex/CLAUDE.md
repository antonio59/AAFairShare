# CLAUDE (convex) – Backend Functions

## Package Identity
- **Purpose:** Convex backend for auth, expenses, categories/locations, recurring items, settlements, savings goals, receipts, and email notifications
- **Tech:** Convex TypeScript functions with Convex Auth (Email/Password) and Resend for emails
- **Entry:** Functions in `convex/*.ts`; schema in `convex/schema.ts`
- **Parent:** Extends [../CLAUDE.md](../CLAUDE.md)

## Setup & Commands
- Dev server: `bun run dev:convex` (or `npx convex dev`)
- Typecheck: `bun x --bun tsc -p convex/tsconfig.json`
- Lint: `bun run lint` (ignores `convex/_generated`)
- Tests: `bun test convex/utils/validation.test.ts`
- Build (front+back): `bun run build`
- Pre-PR (backend scope): `bun run lint && bun x --bun tsc -p convex/tsconfig.json && bun test convex/utils/validation.test.ts`

## Architecture & Patterns (DO/DO NOT)
- **Auth guard:** ✅ Always call `requireAuthenticatedUser` (`convex/utils/auth.ts`) before DB access; see `expenses.ts#getByMonth`. ❌ Do not expose unauthenticated queries/mutations.
- **Validation:** ✅ Use `assertValidDate`, `assertValidMonth`, `assertPositiveAmount` (`convex/utils/validation.ts`) before writes/filters; tests in `convex/utils/validation.test.ts`. ❌ Do not accept unchecked strings/numbers from clients.
- **Indexes:** ✅ Query via `.withIndex` matching `convex/schema.ts` (e.g., `categories.by_name`, `expenses.by_month`). ❌ Avoid full-table `.collect()` when indexed access exists.
- **Updates:** Follow `expenses.update` pattern: recompute `month` from `date`, validate, and filter out undefined fields before `patch`.
- **Side effects:** Use `action`/`internalAction` for external calls (emails). Check env availability before sending (`convex/email.ts`).
- **Generated code:** Never edit `convex/_generated/*`; regenerate via Convex tooling.
- **Closed auth model:** `convex/auth.ts` links users to existing records and rejects unknown emails—keep this constraint unless product decision changes.

## Key Files & Touch Points
- Schema/config: `convex/schema.ts`, `convex/convex.config.ts`, `convex/auth.config.ts`
- Auth: `convex/auth.ts`, `convex/http.ts`, `convex/utils/auth.ts`
- Utilities: `convex/utils/validation.ts`, `convex/utils/validation.test.ts`
- Domain logic: `convex/expenses.ts`, `categories.ts`, `locations.ts`, `recurring.ts`, `settlements.ts`, `savingsGoals.ts`, `receipts.ts`, `monthData.ts`, `analytics.ts`, `cleanup.ts`, `migration.ts`, `email.ts`

## JIT Search Hints
- List functions: `find convex -maxdepth 1 -name "*.ts" ! -name "convex.config.ts"`
- Mutations/queries: `grep -R "\bmutation(\|query(" -n convex`
- Validations: `grep -R "assertValid" -n convex`
- Index usage: `grep -R "withIndex" -n convex`
- Tests: `find convex -name "*.test.ts"`

## Common Gotchas
- Missing envs (`RESEND_API_KEY`, `EMAIL_FROM`) cause email actions to log and return errors—guard before calling.
- Auth is closed; new emails are rejected unless matched to existing user records.
- Do not remove size/type checks or auth requirements when adding upload endpoints.
- Keep `_generated` untouched; rerun Convex codegen/dev to refresh types after schema changes.

## Testing Guidelines
- Run `bun test convex/utils/validation.test.ts` for validation helpers; add new tests alongside utilities or functions under `convex/`.
- Prefer unit-level validation of inputs and index filters; avoid tests that depend on external services.

## Pre-PR Checklist (backend scope)
- `bun run lint && bun x --bun tsc -p convex/tsconfig.json && bun test convex/utils/validation.test.ts`
- Verify new queries/mutations use auth + validation + indexes and avoid touching `_generated`.
