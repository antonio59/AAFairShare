Perform a comprehensive code review of recent changes in AAFairShare:

1. Read relevant CLAUDE.md files (root, then directory-specific) for rules and patterns.
2. Verify React patterns: functional components, hooks for data (`src/hooks/useConvexData.ts`), routing updates in `src/App.tsx`.
3. Check Convex changes: auth guard + validation, index usage, no edits to `convex/_generated/*`.
4. Ensure accessibility and UX: ARIA/labels for inputs, keyboard focus, loading/error states.
5. Security: no secrets/PII logged; uploads keep size/type checks; auth flows not bypassed.
6. Tests: confirm or request `bun test` coverage for new logic; note missing colocated tests.
7. Quality gate: lint/typecheck/build status and bundle impact (large chunks noted by Vite).
8. Provide actionable feedback with file/line references and ready-to-run commands.
