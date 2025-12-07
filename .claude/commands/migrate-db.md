Update Convex schema or data model: $ARGUMENTS

1. Edit schema in `convex/schema.ts` (add indexes when querying new fields).
2. Regenerate types if needed: `npx convex codegen` (or run `bun run dev:convex` to refresh `_generated`).
3. Adjust functions that read/write affected tables (e.g., `convex/expenses.ts`, `convex/savingsGoals.ts`).
4. Add validation for new inputs (`convex/utils/validation.ts`) and tests in `convex/utils/validation.test.ts`.
5. Run quality gate: `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build`.
6. Document any required env changes (.env.example) without committing secrets.
7. Avoid destructive data changes; confirm closed-auth behavior in `convex/auth.ts` still valid.
