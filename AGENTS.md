# AGENTS

## Project Snapshot
- Single-project repo: Vite React SPA with a Convex backend, managed with Bun.
- TypeScript (non-strict), Tailwind + Radix/shadcn UI, TanStack Query, React Router.
- Frontend lives in `src/`, backend Convex functions in `convex/`; each has its own AGENTS.md.

## Root Setup Commands
- Install deps: `bun install`
- Dev: `bun run dev` (Vite on 8080) + `bun run dev:convex` (Convex backend)
- Build: `bun run build`; Preview: `bun run preview`
- Lint: `bun run lint`; Typecheck: `bunx --bun tsc --noEmit`
- Tests: `bun test`

## Universal Conventions
- Use the `@/` path alias (see `tsconfig.json`) and functional React components.
- Follow ESLint config (`eslint.config.js`); unused vars are currently allowed, hooks rules enforced.
- UI uses Tailwind tokens and shadcn primitives from `src/components/ui/*`; keep styles utility-first.
- Prefer Conventional Commit-style messages and feature branches; small, focused PRs with linked tickets/issues.

## Security & Secrets
- Never commit `.env` or API keys. Use `.env.example` as the template.
- Frontend needs `VITE_CONVEX_URL`; demo mode toggles with `VITE_GUEST_MODE=true`.
- Convex secrets (`AUTH_GOOGLE_ID/SECRET`, `SITE_URL`, `JWT_PRIVATE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`) must be set via `npx convex env set`.
- Avoid logging PII; scrub debug output before pushing.

## Environments (Convex & Frontend)
- **Local dev:** run `bun run dev:convex` (Convex on `http://localhost:8187`) and `VITE_CONVEX_URL=http://localhost:8187 bun run dev` for the SPA.
- **Production:** set `VITE_CONVEX_URL` in hosting/CI to the prod Convex URL; do not check env files into git.
- **Deploy Convex:** `npx convex deploy` (optionally `--deployment <name>` for multi-env) from the branch to promote.
- **Secrets per env:** set via `npx convex env set KEY "value"` separately for dev/prod.
- **Safety:** never point local builds at prod Convex; keep `.env.local` git-ignored and use hosting/CI env vars for prod.

## JIT Index (what to open, not what to paste)

### Package Structure
- Frontend SPA: `src/` → [see src/AGENTS.md](src/AGENTS.md)
- Convex backend: `convex/` → [see convex/AGENTS.md](convex/AGENTS.md)
- Automation: `scripts/capture-screens.ts` for screenshot capture (run with `bun scripts/capture-screens.ts`).

### Quick Find Commands
- List pages/routes: `find src/pages -name "*.tsx"`
- Find Convex queries/mutations: `grep -R "mutation(" convex` and `grep -R "query(" convex`
- Search UI primitives usage: `grep -R "components/ui" src`
- Locate shared types: `find src/types -name "*.ts"`

## Definition of Done
- `bun run lint && bunx --bun tsc --noEmit && bun test && bun run build` all pass.
- New routes registered in `src/App.tsx`; data flows use `src/hooks/useConvexData.ts`.
- No secrets or PII in code/logs; update sub-AGENTS if structure changes.
