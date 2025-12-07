Analyze and fix a GitHub issue: $ARGUMENTS

1. Fetch details: `gh issue view $ARGUMENTS` (or read provided context).
2. Identify scope; open relevant CLAUDE.md (root and subdir) for rules.
3. Locate code with `find src -name "*.tsx"` or `grep -R "$ARGUMENTS" -n src convex` as needed.
4. Implement changes following patterns: use `useConvexData` for data, keep auth/validation in Convex, reuse layout/UI primitives.
5. Add/adjust tests near changes (e.g., new `*.test.tsx` or in `convex/utils`).
6. Run quality gate: `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build`.
7. Prepare commit message (Conventional style) and summarize impacts/risks.
8. If applicable, ready Netlify/CI considerations noted in `.github/workflows/*`.
