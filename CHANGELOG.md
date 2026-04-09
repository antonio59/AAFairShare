# Changelog

All notable changes to this project will be documented in this file.
## [Unreleased]

### Bug Fixes

- Add VITE_CONVEX_URL to GitHub Actions build environment
- Update vite to 7.3.2 to resolve security vulnerabilities (GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583)
- Revert auth.config.ts to use CONVEX_SITE_URL
- Resolve TypeScript errors in Convex deployment
- Use correct SITE_URL env var in auth config
- Add vulnerable packages as direct deps to force resolution
- Resolve all security vulnerabilities
- Resolve TypeScript errors and update auth dependencies
- Update dependencies to address vulnerabilities
- **ui**: Update Login and expense table for dark mode compatibility
- Fix(auth): use correct provider id
     'password' for signIn
- Replace any types with proper ReceiptItem union type
- Split useTheme hook into separate file for Fast Refresh
- Standalone receipts not showing in UI
- Dark mode for sidebar, table header, and add toggle to header
- Show avatars only without names across all components
- Mobile card avatar - remove username text, fix avatar field
- Remove PWA install prompt component
- Delete expense functionality and improve table UI
- Add fallback for VITE_CONVEX_URL in production
- Add VITE_CONVEX_URL to netlify build environment
- Add explicit redirectTo for OAuth flow
- Explicitly inject env vars in Vite define config
- Add Savings Goals to mobile bottom navigation
- Remove edge function dependency causing mobile initialization hang
- Resolve Google OAuth redirect loop and 401 errors
- Remove scroll on amount input and fix save button loading state
- Move darwin rollup to optionalDependencies for Netlify builds
- **ci**: Fix Supabase keep-alive workflow to properly ping heartbeat function
- Improve database synchronization for expense and location operations
- Add missing resend dependency
- **ci**: Remove faulty build command from netlify.toml
- **ci**: Add netlify config to run db migrations
- **deps**: Resolve merge conflict and update lockfile
- **ci**: Resolve netlify deployment failure
- Remove username from paid by column and fix analytics and alert issues
- **db**: Correct typo in analytics function
- **analytics**: Resolve data loading error and improve heartbeat
- Resolve CI EBADPLATFORM for @rollup/rollup-darwin-arm64
- Remove platform-specific packages from devDependencies for CI
- Adjust optionalDependencies for CI build
- Fix settlement email
- **deps**: Correctly list platform-specific packages as optionalDependencies
- **ci**: Use npm install instead of npm ci in Netlify deploy workflow
- **deps**: Configure platform-specific native deps as optional
- **build**: Resolve build errors on macOS ARM64
- Resolve settlement errors and add user service
- Remove manual Content-Type for FormData in emailService
- **workflows**: Add explicit permissions to address CodeQL alerts
- Update date-fns to resolve dependency conflict

### CI/CD

- Add automatic changelog workflow
- Add automatic changelog workflow
- Add automatic changelog workflow
- Add GitHub Actions workflow
- Add Supabase keep-alive workflow

### Changes

- Merge branch 'fix/vulnerabilities' into main - add Bills feature
- Merge pull request #39 from antonio59/fix/vulnerabilities

Fix/vulnerabilities
- Merge pull request #38 from antonio59/fix/vulnerabilities

fix: security updates
- Add Bills feature with address management and expense linking
- Make selected category more prominent with solid background
- Add Moving category with truck icon
- Remove FAB, add contextual Add button on Dashboard for mobile
- Use Drawer for date picker on mobile to fix clipping issue
- Fix popover clipping on mobile with better collision handling
- Fix calendar navigation button positioning and mobile tap targets
- Update calendar component for react-day-picker v9 API
- Fix calendar day header alignment and spacing
- Add comprehensive documentation hierarchy

Create BMAD-style documentation structure:
- docs/index.md: Central documentation hub
- getting-started/: Installation, configuration, first steps
- architecture/: System design, database schema, folder structure
- features/: Feature overview and capabilities
- api/: Convex API reference
- development/: Contributing guide and coding standards
- deployment/: Production deployment guides
- Improve form consistency and UX across expense forms

- EditExpenseDialog: Add consistent spacing between fields
- AddRecurringExpenseForm: Use shared components (AmountInput, DateSelector), add SplitTypeSelector
- EditRecurringExpenseForm: Same improvements, add SplitTypeSelector and UserSelector
- FrequencySelector: Add dark mode support with semantic CSS variables
- UserSelector: Add loading state, support both image/photoUrl fields
- DateSelector: Add customizable label prop for 'Next Due Date' usage
- Improve security, performance, and code quality

Security:
- Add login rate limiting (5 attempts/5min, 15min lockout)
- Remove hardcoded Convex URL fallback
- Add enum validation for splitType, frequency, status

Performance:
- Fix N+1 queries with batch fetching utilities
- Add paginated expenses query

Code Quality:
- Re-enable ESLint no-unused-vars with underscore pattern
- Fix all lint warnings across codebase
- Add keyboard shortcuts modal (replaces alert)
- Add aria-live regions for accessibility
- Use CSS variables for semantic colors
- Display form errors in AddExpense page
- Redesign Add Expense form with improved UX and visual hierarchy

Layout:
- Centered card with max-w-md constraint
- Comfortable vertical spacing (space-y-6) between field groups
- Responsive Amount+Date row (stacks on mobile, side-by-side on desktop)

Field grouping:
- Group 1: Amount + Date
- Group 2: Category + Receipt (optional)
- Group 3: Location + Split Type + Description

Category:
- Compact pill/tag style with rounded-full borders
- Flex wrap layout with gap-2 for airy feel
- Smaller visual weight with inline icon+text

Split controls:
- Compact segmented control (not full-width)
- Clear selected/unselected states with subtle styling
- '100% Mine' label for clarity

Inputs:
- Consistent label styling (text-sm font-medium mb-2 block)
- Full-width inputs within constrained card

Receipt:
- Neutral outline buttons with muted text
- Clear (optional) indicator

Buttons:
- Save Expense as primary action (right-aligned)
- Cancel as ghost/low-emphasis (size-sm)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Redesign Add Expense form: compact card layout with better hierarchy

- Wrap form in Card with max-w-lg for focused width
- Group fields into logical 2-column rows (Amount/Date, Category/Location, Split/Description)
- SplitTypeSelector: compact segmented control (iOS-style pill toggle)
- CategorySelector: 3-column grid with smaller icons
- ReceiptUpload: inline compact buttons instead of tall cards
- Button hierarchy: ghost Cancel, prominent Save with flex-[2]
- Tighter spacing throughout (space-y-4, mt-1.5, gap-3)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Improve form components for desktop and mobile

- SplitTypeSelector: Compact design with icons, 50/50 and 100% labels
- CategorySelector: Smaller icons (h-4), more columns on desktop, dark mode
- LocationSelector: Consistent margin
- AddExpense: Tighter spacing (mb-4)
- All selectors: Dark mode support with proper hover states

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add undo button to settlement history, update version info

- Add Undo button to settlement history (desktop table and mobile)
- Remove PWA from FEATURES list
- Update VERSION_HISTORY with v3.2.0 changes
- Clean up duplicate version entries
- Add errorBoundary and settlementBreakdown to features

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Remove PWA support to simplify deployments (v3.2.0)

- Remove vite-plugin-pwa and workbox-window dependencies
- Remove PWA assets (icons, screenshots, manifest generation scripts)
- Update vite.config.ts to remove VitePWA plugin
- Update README to remove PWA feature mention
- Update CHANGELOG with v3.2.0 release notes

PWA was causing service worker caching issues during deployments,
leading to stale chunks and broken page loads after updates.

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add selfDestroying to PWA to clear old service worker

This will unregister the old SW on next visit

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Remove _headers file - may be causing Netlify issues

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Move SPA redirect to netlify.toml with force=false

- Remove _redirects file
- Add redirect rule in netlify.toml
- force=false ensures existing files are served directly

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix PWA service worker caching issues

- Add skipWaiting and clientsClaim for immediate SW updates
- Enable cleanupOutdatedCaches to remove old cached chunks
- Remove JS/CSS from precache, use StaleWhileRevalidate instead
- Prevents stale chunk errors on deployments

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix _redirects to use 200! for proper asset handling

The ! suffix makes Netlify only apply the redirect when no file exists

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix Convex URL fallback to use production instead of localhost

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix Netlify caching and asset handling

- Update _redirects to let missing assets 404 properly
- Add _headers for proper cache control
- Prevents stale JS chunks from returning HTML

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Improve Settlement page, fix Analytics, add ErrorBoundary

- Settlement: Add breakdown section showing paid amounts, shared expenses, personal expenses
- Settlement: Improve history section with table layout and better month formatting
- Analytics: Fix Fair Share calculation to use shared expenses only
- Analytics: Add real spend trend comparison vs previous month
- Analytics: Populate category/location charts from expense data
- Analytics: Add proper empty states with icons and helpful messages
- Settings: Fix dark mode styling for Features section
- Add ErrorBoundary for graceful error handling

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Merge pull request #30 from antonio59/feat/login-revamp-email-auth

Migrate login to email/password authentication and remove Google OAuth references
- Merge pull request #29 from antonio59/feat/auth-email-credentials

feat(auth): migrate to credentials-based email/password with password hashing and seeding utilities
- Merge pull request #28 from antonio59/audit-user-links-cli-docs

Audit user links across tables before auth migration
- Merge pull request #27 from antonio59/dependabot/npm_and_yarn/dependencies-7da893f015

chore(deps-dev): bump @esbuild/darwin-arm64 from 0.25.12 to 0.27.1 in the dependencies group
- Adopt React 19 features: ref as prop and useActionState

- Remove forwardRef from Input, Button, Textarea components
  (React 19 allows ref as a regular prop)
- Refactor AddExpense to use useActionState for form handling
  (replaces manual isLoading state management)
- Cleaner component APIs with less boilerplate

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix cookie vulnerability by overriding to ^0.7.0

Override transitive cookie dependency to fix GHSA-pxg6-pf52-xh8x
(cookie accepts name/path/domain with out of bounds characters)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Update all dependencies to latest versions

Major updates:
- React 18 -> 19.2.1
- react-router-dom 6 -> 7.10.1
- date-fns 3 -> 4.1.0
- zod 3 -> 4.1.13
- recharts 2 -> 3.5.1
- tailwind-merge 2 -> 3.4.0
- sonner 1 -> 2.0.7
- vaul 0.9 -> 1.1.2
- @hookform/resolvers 3 -> 5.2.2
- nanoid 3 -> 5.1.6
- react-day-picker 8 -> 9.12.0
- react-resizable-panels 2 -> 3.0.6
- resend 3 -> 6.5.2
- eslint-plugin-react-hooks 5 -> 7.0.1

Fix sidebar skeleton to use useId() for deterministic width
(required by stricter react-hooks/purity rules in v7)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add tests and build verification to CI workflow

- Add bun test step to verify tests pass on PRs
- Add build verification step to catch build failures before merge
- Update actions/checkout to v4 and oven-sh/setup-bun to v2
- Reorder steps: lint -> typecheck -> test -> build

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Upgrade to Tailwind CSS v4 with container queries and field-sizing

- Migrate from Tailwind v3.4 to v4.1.17 with @tailwindcss/vite plugin
- Convert tailwind.config.ts to CSS-first config with @theme in index.css
- Add container queries (@container, @sm:, @xs:) to analytics and expense cards
- Add nth-* zebra striping to ExpensesTable
- Add field-sizing-content support to Textarea component
- Fix security: remove hardcoded prod Convex URL, use localhost fallback
- Fix performance: use indexed queries in auth and analytics
- Add by_location and by_category indexes to expenses table

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Improve landing tour sizing and copy

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Separate mobile and desktop tour assets on landing

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Switch CI workflows to Bun

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Support desktop viewport in capture script

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Refine landing product tour responsiveness

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add landing product tour slider with mobile captures

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Improve demo savings data and allow custom demo user

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix capture script routes and demo stats

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add Playwright dependency for capture script

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add Playwright mobile capture script

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add demo mode for local screenshots

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Bump app version to 3.2.0

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add recent updates section to landing page

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Update changelog for recent releases

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Refine expense table layout

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Switch Netlify to Bun installs

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Adjust overrides to satisfy npm install on Netlify

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Refocus landing page for portfolio

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Harden Convex auth and validation checks

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix expense month not updating when date is edited

- Recalculate month field in update mutation when date changes
- Use string parsing instead of Date object to avoid timezone issues
- Apply same fix to recurring expense generation

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Update landing page for portfolio showcase

- Redirect unauthenticated users to landing page instead of login
- Add sticky header with branding and Private App badge
- Replace purple gradients with blue-teal color scheme
- Update messaging to reflect portfolio showcase purpose
- Remove sign-in buttons (closed 2-user app)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Fix mobile Settings page: hide FAB, fix text overflow

- Hide floating action button on Settings page
- Add text truncation for long emails/usernames
- Add flex-shrink-0 to prevent avatar/badge squishing
- Use responsive sizing for profile avatar

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Improve mobile UX and add high contrast mode for grayscale displays

- Add mobile access to Recurring and Receipts via header dropdown menu
- Add dedicated theme toggle button in mobile header
- Add high contrast theme optimized for grayscale displays
- Fix Settings page card spacing
- Fix dark mode styling in Recurring, LocationsManager, CategoriesManager

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add logging to check env var in Netlify build
- Add final setup checklist

Summary of completed work and remaining steps:
- Google OAuth button implemented
- Keep-alive working and verified
- Quick checklist for Google Console and Supabase config
- Testing instructions
- Current status overview

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add Google OAuth sign-in button to login page

- Created useGoogleAuth hook for Google OAuth flow
- Updated LoginForm component with Google sign-in button
- Added visual separator between OAuth and email/password login
- Includes Google logo SVG icon
- Maintains email/password as fallback option
- Installed @supabase/supabase-js dependency

Users can now sign in with Google OAuth or email/password.

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add keep-alive verification guide

Complete guide for verifying Supabase keep-alive is working:
- GitHub Actions verification steps
- Manual testing methods
- Troubleshooting failed runs
- Monitoring and notifications setup

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add Google OAuth setup guide for Supabase

Complete guide for configuring Google OAuth:
- Google Console redirect URI configuration
- Supabase provider setup
- URL configuration
- Troubleshooting common issues
- Security best practices

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Add .env.example for Supabase configuration
- Add Supabase keep-alive setup documentation

Reverted Pocketbase migration to focus on Supabase keep-alive solution.
This guide explains how to prevent Supabase free tier from pausing due
to inactivity using GitHub Actions workflow.

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
- Merge dependabot PR: bump lucide-react from 0.522.0 to 0.552.0
- Correct linter configuration and improve summary card layout
- Improve responsive layout of summary cards (no-verify)
- Re-apply npm audit fix
- Merge remote-tracking branch 'origin/main'
- Merge pull request #5 from antonio59/dependabot/npm_and_yarn/dependencies-07ecb03a22

chore(deps): bump the dependencies group across 1 directory with 46 updates
- Resolve expense submission race condition and npm audit vulnerability
- Simplify keep-alive workflow and improve error handling
- Improve Supabase keep-alive workflow with more frequent pings and better reliability
- Reduce sidebar width to w-48
- Relocate platform-specific deps to optionalDependencies
- Adjust UI layouts and fix build issues
- **edge-fn**: Use RESEND_API_KEY env var for Resend auth
- **edge-fn**: Correct FormData key retrieval and add import_map for Deno modules
- Add troubleshooting guide for native module build issues
- Relocate platform-specific native modules to optionalDependencies for CI compatibility
- Resolve native module issues for ARM Mac build
- Use native fetch for sendSettlementEmail to ensure correct Content-Type
- Simplify FormData in emailService to debug Content-Type issue
- Display usernames on settlement cards and test email Content-Type
- Enhance Supabase client init logging and add timeout; fix useEffect dep
- Fix user data display, address settlement errors, and add useAppAuth hook
- Move platform-specific dependencies to optionalDependencies
- Resolve linting & build issues, update dependencies, and clean login UI
- Merge remote-tracking branch 'origin/main'
- Merge pull request #1 from antonio59/dependabot/npm_and_yarn/dependencies-2535799f78

Bump the dependencies group with 55 updates
- Bump the dependencies group with 55 updates

Bumps the dependencies group with 55 updates:

| Package | From | To |
| --- | --- | --- |
| [@hookform/resolvers](https://github.com/react-hook-form/resolvers) | `3.9.0` | `3.10.0` |
| [@radix-ui/react-accordion](https://github.com/radix-ui/primitives) | `1.2.1` | `1.2.10` |
| [@radix-ui/react-alert-dialog](https://github.com/radix-ui/primitives) | `1.1.2` | `1.1.13` |
| [@radix-ui/react-aspect-ratio](https://github.com/radix-ui/primitives) | `1.1.0` | `1.1.6` |
| [@radix-ui/react-avatar](https://github.com/radix-ui/primitives) | `1.1.1` | `1.1.9` |
| [@radix-ui/react-checkbox](https://github.com/radix-ui/primitives) | `1.1.2` | `1.3.1` |
| [@radix-ui/react-collapsible](https://github.com/radix-ui/primitives) | `1.1.1` | `1.1.10` |
| [@radix-ui/react-context-menu](https://github.com/radix-ui/primitives) | `2.2.2` | `2.2.14` |
| [@radix-ui/react-dialog](https://github.com/radix-ui/primitives) | `1.1.2` | `1.1.13` |
| [@radix-ui/react-dropdown-menu](https://github.com/radix-ui/primitives) | `2.1.2` | `2.1.14` |
| [@radix-ui/react-hover-card](https://github.com/radix-ui/primitives) | `1.1.2` | `1.1.13` |
| [@radix-ui/react-label](https://github.com/radix-ui/primitives) | `2.1.0` | `2.1.6` |
| [@radix-ui/react-menubar](https://github.com/radix-ui/primitives) | `1.1.2` | `1.1.14` |
| [@radix-ui/react-navigation-menu](https://github.com/radix-ui/primitives) | `1.2.1` | `1.2.12` |
| [@radix-ui/react-popover](https://github.com/radix-ui/primitives) | `1.1.2` | `1.1.13` |
| [@radix-ui/react-progress](https://github.com/radix-ui/primitives) | `1.1.0` | `1.1.6` |
| [@radix-ui/react-radio-group](https://github.com/radix-ui/primitives) | `1.2.1` | `1.3.6` |
| [@radix-ui/react-scroll-area](https://github.com/radix-ui/primitives) | `1.2.0` | `1.2.8` |
| [@radix-ui/react-select](https://github.com/radix-ui/primitives) | `2.1.2` | `2.2.4` |
| [@radix-ui/react-separator](https://github.com/radix-ui/primitives) | `1.1.0` | `1.1.6` |
| [@radix-ui/react-slider](https://github.com/radix-ui/primitives) | `1.2.1` | `1.3.4` |
| [@radix-ui/react-slot](https://github.com/radix-ui/primitives) | `1.1.0` | `1.2.2` |
| [@radix-ui/react-switch](https://github.com/radix-ui/primitives) | `1.1.1` | `1.2.4` |
| [@radix-ui/react-tabs](https://github.com/radix-ui/primitives) | `1.1.1` | `1.1.11` |
| [@radix-ui/react-toast](https://github.com/radix-ui/primitives) | `1.2.2` | `1.2.13` |
| [@radix-ui/react-toggle](https://github.com/radix-ui/primitives) | `1.1.0` | `1.1.8` |
| [@radix-ui/react-toggle-group](https://github.com/radix-ui/primitives) | `1.1.0` | `1.1.9` |
| [@radix-ui/react-tooltip](https://github.com/radix-ui/primitives) | `1.1.4` | `1.2.6` |
| [@tanstack/react-query](https://github.com/TanStack/query/tree/HEAD/packages/react-query) | `5.59.16` | `5.75.7` |
| [cmdk](https://github.com/pacocoursey/cmdk/tree/HEAD/cmdk) | `1.0.0` | `1.1.1` |
| [embla-carousel-react](https://github.com/davidjerleke/embla-carousel) | `8.3.0` | `8.6.0` |
| [input-otp](https://github.com/guilhermerodz/input-otp/tree/HEAD/packages/input-otp) | `1.2.4` | `1.4.2` |
| [lucide-react](https://github.com/lucide-icons/lucide/tree/HEAD/packages/lucide-react) | `0.462.0` | `0.509.0` |
| [next-themes](https://github.com/pacocoursey/next-themes) | `0.3.0` | `0.4.6` |
| [react-hook-form](https://github.com/react-hook-form/react-hook-form) | `7.53.1` | `7.56.3` |
| [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | `2.1.5` | `2.1.9` |
| [react-router-dom](https://github.com/remix-run/react-router/tree/HEAD/packages/react-router-dom) | `6.27.0` | `6.30.0` |
| [recharts](https://github.com/recharts/recharts) | `2.13.0` | `2.15.3` |
| [sonner](https://github.com/emilkowalski/sonner) | `1.5.0` | `1.7.4` |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | `2.5.4` | `2.6.0` |
| [zod](https://github.com/colinhacks/zod) | `3.23.8` | `3.24.4` |
| [@eslint/js](https://github.com/eslint/eslint/tree/HEAD/packages/js) | `9.13.0` | `9.26.0` |
| [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography) | `0.5.15` | `0.5.16` |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node) | `22.7.9` | `22.15.17` |
| [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/tree/HEAD/packages/plugin-react-swc) | `3.7.1` | `3.9.0` |
| [autoprefixer](https://github.com/postcss/autoprefixer) | `10.4.20` | `10.4.21` |
| [eslint](https://github.com/eslint/eslint) | `9.13.0` | `9.26.0` |
| [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/HEAD/packages/eslint-plugin-react-hooks) | `5.1.0-rc-fb9a90fa48-20240614` | `5.2.0` |
| [eslint-plugin-react-refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) | `0.4.14` | `0.4.20` |
| [globals](https://github.com/sindresorhus/globals) | `15.11.0` | `15.15.0` |
| lovable-tagger | `1.1.7` | `1.1.8` |
| [postcss](https://github.com/postcss/postcss) | `8.4.47` | `8.5.3` |
| [typescript](https://github.com/microsoft/TypeScript) | `5.6.3` | `5.8.3` |
| [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-eslint) | `8.11.0` | `8.32.0` |
| [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) | `5.4.10` | `5.4.19` |


Updates `@hookform/resolvers` from 3.9.0 to 3.10.0
- [Release notes](https://github.com/react-hook-form/resolvers/releases)
- [Commits](https://github.com/react-hook-form/resolvers/compare/v3.9.0...v3.10.0)

Updates `@radix-ui/react-accordion` from 1.2.1 to 1.2.10
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-alert-dialog` from 1.1.2 to 1.1.13
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-aspect-ratio` from 1.1.0 to 1.1.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-avatar` from 1.1.1 to 1.1.9
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-checkbox` from 1.1.2 to 1.3.1
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-collapsible` from 1.1.1 to 1.1.10
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-context-menu` from 2.2.2 to 2.2.14
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-dialog` from 1.1.2 to 1.1.13
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-dropdown-menu` from 2.1.2 to 2.1.14
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-hover-card` from 1.1.2 to 1.1.13
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-label` from 2.1.0 to 2.1.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-menubar` from 1.1.2 to 1.1.14
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-navigation-menu` from 1.2.1 to 1.2.12
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-popover` from 1.1.2 to 1.1.13
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-progress` from 1.1.0 to 1.1.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-radio-group` from 1.2.1 to 1.3.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-scroll-area` from 1.2.0 to 1.2.8
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-select` from 2.1.2 to 2.2.4
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-separator` from 1.1.0 to 1.1.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-slider` from 1.2.1 to 1.3.4
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-slot` from 1.1.0 to 1.2.2
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-switch` from 1.1.1 to 1.2.4
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-tabs` from 1.1.1 to 1.1.11
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-toast` from 1.2.2 to 1.2.13
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-toggle` from 1.1.0 to 1.1.8
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-toggle-group` from 1.1.0 to 1.1.9
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@radix-ui/react-tooltip` from 1.1.4 to 1.2.6
- [Changelog](https://github.com/radix-ui/primitives/blob/main/release-process.md)
- [Commits](https://github.com/radix-ui/primitives/commits)

Updates `@tanstack/react-query` from 5.59.16 to 5.75.7
- [Release notes](https://github.com/TanStack/query/releases)
- [Commits](https://github.com/TanStack/query/commits/v5.75.7/packages/react-query)

Updates `cmdk` from 1.0.0 to 1.1.1
- [Release notes](https://github.com/pacocoursey/cmdk/releases)
- [Commits](https://github.com/pacocoursey/cmdk/commits/v1.1.1/cmdk)

Updates `embla-carousel-react` from 8.3.0 to 8.6.0
- [Release notes](https://github.com/davidjerleke/embla-carousel/releases)
- [Commits](https://github.com/davidjerleke/embla-carousel/compare/v8.3.0...v8.6.0)

Updates `input-otp` from 1.2.4 to 1.4.2
- [Changelog](https://github.com/guilhermerodz/input-otp/blob/master/CHANGELOG.md)
- [Commits](https://github.com/guilhermerodz/input-otp/commits/HEAD/packages/input-otp)

Updates `lucide-react` from 0.462.0 to 0.509.0
- [Release notes](https://github.com/lucide-icons/lucide/releases)
- [Commits](https://github.com/lucide-icons/lucide/commits/0.509.0/packages/lucide-react)

Updates `next-themes` from 0.3.0 to 0.4.6
- [Release notes](https://github.com/pacocoursey/next-themes/releases)
- [Commits](https://github.com/pacocoursey/next-themes/compare/v0.3.0...v0.4.6)

Updates `react-hook-form` from 7.53.1 to 7.56.3
- [Release notes](https://github.com/react-hook-form/react-hook-form/releases)
- [Changelog](https://github.com/react-hook-form/react-hook-form/blob/master/CHANGELOG.md)
- [Commits](https://github.com/react-hook-form/react-hook-form/compare/v7.53.1...v7.56.3)

Updates `react-resizable-panels` from 2.1.5 to 2.1.9
- [Release notes](https://github.com/bvaughn/react-resizable-panels/releases)
- [Commits](https://github.com/bvaughn/react-resizable-panels/compare/2.1.5...2.1.9)

Updates `react-router-dom` from 6.27.0 to 6.30.0
- [Release notes](https://github.com/remix-run/react-router/releases)
- [Changelog](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md)
- [Commits](https://github.com/remix-run/react-router/commits/react-router-dom@6.30.0/packages/react-router-dom)

Updates `recharts` from 2.13.0 to 2.15.3
- [Release notes](https://github.com/recharts/recharts/releases)
- [Changelog](https://github.com/recharts/recharts/blob/3.x/CHANGELOG.md)
- [Commits](https://github.com/recharts/recharts/compare/v2.13.0...v2.15.3)

Updates `sonner` from 1.5.0 to 1.7.4
- [Release notes](https://github.com/emilkowalski/sonner/releases)
- [Commits](https://github.com/emilkowalski/sonner/commits)

Updates `tailwind-merge` from 2.5.4 to 2.6.0
- [Release notes](https://github.com/dcastil/tailwind-merge/releases)
- [Commits](https://github.com/dcastil/tailwind-merge/compare/v2.5.4...v2.6.0)

Updates `zod` from 3.23.8 to 3.24.4
- [Release notes](https://github.com/colinhacks/zod/releases)
- [Changelog](https://github.com/colinhacks/zod/blob/main/CHANGELOG.md)
- [Commits](https://github.com/colinhacks/zod/compare/v3.23.8...v3.24.4)

Updates `@eslint/js` from 9.13.0 to 9.26.0
- [Release notes](https://github.com/eslint/eslint/releases)
- [Changelog](https://github.com/eslint/eslint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/eslint/commits/v9.26.0/packages/js)

Updates `@tailwindcss/typography` from 0.5.15 to 0.5.16
- [Release notes](https://github.com/tailwindlabs/tailwindcss-typography/releases)
- [Changelog](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/CHANGELOG.md)
- [Commits](https://github.com/tailwindlabs/tailwindcss-typography/compare/v0.5.15...v0.5.16)

Updates `@types/node` from 22.7.9 to 22.15.17
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

Updates `@vitejs/plugin-react-swc` from 3.7.1 to 3.9.0
- [Release notes](https://github.com/vitejs/vite-plugin-react/releases)
- [Changelog](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite-plugin-react/commits/plugin-react-swc@3.9.0/packages/plugin-react-swc)

Updates `autoprefixer` from 10.4.20 to 10.4.21
- [Release notes](https://github.com/postcss/autoprefixer/releases)
- [Changelog](https://github.com/postcss/autoprefixer/blob/main/CHANGELOG.md)
- [Commits](https://github.com/postcss/autoprefixer/compare/10.4.20...10.4.21)

Updates `eslint` from 9.13.0 to 9.26.0
- [Release notes](https://github.com/eslint/eslint/releases)
- [Changelog](https://github.com/eslint/eslint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/eslint/eslint/compare/v9.13.0...v9.26.0)

Updates `eslint-plugin-react-hooks` from 5.1.0-rc-fb9a90fa48-20240614 to 5.2.0
- [Release notes](https://github.com/facebook/react/releases)
- [Changelog](https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/CHANGELOG.md)
- [Commits](https://github.com/facebook/react/commits/HEAD/packages/eslint-plugin-react-hooks)

Updates `eslint-plugin-react-refresh` from 0.4.14 to 0.4.20
- [Release notes](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/releases)
- [Changelog](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/blob/main/CHANGELOG.md)
- [Commits](https://github.com/ArnaudBarre/eslint-plugin-react-refresh/compare/v0.4.14...v0.4.20)

Updates `globals` from 15.11.0 to 15.15.0
- [Release notes](https://github.com/sindresorhus/globals/releases)
- [Commits](https://github.com/sindresorhus/globals/compare/v15.11.0...v15.15.0)

Updates `lovable-tagger` from 1.1.7 to 1.1.8

Updates `postcss` from 8.4.47 to 8.5.3
- [Release notes](https://github.com/postcss/postcss/releases)
- [Changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md)
- [Commits](https://github.com/postcss/postcss/compare/8.4.47...8.5.3)

Updates `typescript` from 5.6.3 to 5.8.3
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Changelog](https://github.com/microsoft/TypeScript/blob/main/azure-pipelines.release-publish.yml)
- [Commits](https://github.com/microsoft/TypeScript/compare/v5.6.3...v5.8.3)

Updates `typescript-eslint` from 8.11.0 to 8.32.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.32.0/packages/typescript-eslint)

Updates `vite` from 5.4.10 to 5.4.19
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/v5.4.19/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v5.4.19/packages/vite)

---
updated-dependencies:
- dependency-name: "@hookform/resolvers"
  dependency-version: 3.10.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-accordion"
  dependency-version: 1.2.10
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-alert-dialog"
  dependency-version: 1.1.13
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-aspect-ratio"
  dependency-version: 1.1.6
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-avatar"
  dependency-version: 1.1.9
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-checkbox"
  dependency-version: 1.3.1
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-collapsible"
  dependency-version: 1.1.10
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-context-menu"
  dependency-version: 2.2.14
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-dialog"
  dependency-version: 1.1.13
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-dropdown-menu"
  dependency-version: 2.1.14
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-hover-card"
  dependency-version: 1.1.13
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-label"
  dependency-version: 2.1.6
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-menubar"
  dependency-version: 1.1.14
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-navigation-menu"
  dependency-version: 1.2.12
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-popover"
  dependency-version: 1.1.13
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-progress"
  dependency-version: 1.1.6
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-radio-group"
  dependency-version: 1.3.6
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-scroll-area"
  dependency-version: 1.2.8
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-select"
  dependency-version: 2.2.4
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-separator"
  dependency-version: 1.1.6
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-slider"
  dependency-version: 1.3.4
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-slot"
  dependency-version: 1.2.2
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-switch"
  dependency-version: 1.2.4
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-tabs"
  dependency-version: 1.1.11
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-toast"
  dependency-version: 1.2.13
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-toggle"
  dependency-version: 1.1.8
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-toggle-group"
  dependency-version: 1.1.9
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@radix-ui/react-tooltip"
  dependency-version: 1.2.6
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@tanstack/react-query"
  dependency-version: 5.75.7
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: cmdk
  dependency-version: 1.1.1
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: embla-carousel-react
  dependency-version: 8.6.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: input-otp
  dependency-version: 1.4.2
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: lucide-react
  dependency-version: 0.509.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: next-themes
  dependency-version: 0.4.6
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: react-hook-form
  dependency-version: 7.56.3
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: react-resizable-panels
  dependency-version: 2.1.9
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: react-router-dom
  dependency-version: 6.30.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: recharts
  dependency-version: 2.15.3
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: sonner
  dependency-version: 1.7.4
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: tailwind-merge
  dependency-version: 2.6.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: zod
  dependency-version: 3.24.4
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@eslint/js"
  dependency-version: 9.26.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@tailwindcss/typography"
  dependency-version: 0.5.16
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: "@types/node"
  dependency-version: 22.15.17
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: "@vitejs/plugin-react-swc"
  dependency-version: 3.9.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: autoprefixer
  dependency-version: 10.4.21
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: eslint
  dependency-version: 9.26.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: eslint-plugin-react-hooks
  dependency-version: 5.2.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: eslint-plugin-react-refresh
  dependency-version: 0.4.20
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: globals
  dependency-version: 15.15.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: lovable-tagger
  dependency-version: 1.1.8
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependencies
- dependency-name: postcss
  dependency-version: 8.5.3
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: typescript
  dependency-version: 5.8.3
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: typescript-eslint
  dependency-version: 8.32.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependencies
- dependency-name: vite
  dependency-version: 5.4.19
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependencies
...

Signed-off-by: dependabot[bot] <support@github.com>
- Import and type errors
- General code cleanup and improvements
- Remove Supabase key from client.ts
- Resolve edge function import error
- Improve error handling for email service

Enhance error messages and add debug information for email sending failures.
- Resolve email sending issue
- Improve mobile UI/UX
- Remove signup functionality

Remove signup form and related logic.
- Prevent user creation on login
- Supabase initialization error
- Handle edge function request failure
- Edge function availability check
- Handle edge function unavailability
- Ensure email addresses are fetched from users
- Split email sending service into modules
- Email test config type error
- Extract email sending service
- Split TestEmail page into smaller components
- Modularize send-settlement-email function
- Edge function request failure
- Resolve edge function invocation error
- Remove invalid options in invoke
- Edge function invocation error
- Send email with edge function secrets
- Supabase client initialization
- TestEmail type errors
- Test settlement email function

Add a test to verify the send-settlement-email function.
- Remove hardcoded email addresses
- Secure Supabase API key
- Edge function 401 error
- Fetch config error in edge function
- Handle Supabase config fetch error
- Supabase client initialization
- Resolve TypeScript errors
- Supabase client import and usage
- Store secrets in edge functions
- Code quality checks
- Update Netlify deployment settings
- Add Netlify deployment instructions

Add information on how to deploy the project to Netlify.
- Update dependencies and add workflows

Update all project dependencies to their latest stable and secure versions.
Add GitHub Actions workflows for dependency updates and security checks.
- Add real-time expense updates and mobile optimization

Implement real-time updates to the expense table after adding an expense. Add mobile optimization.
- Review and address incomplete features
- Dependency installation error
- Split export service into modules
- Round expense amounts to two decimals
- Remove percentage labels from pie chart

Remove the percentage labels from the pie chart, as they are already included in the tooltips.
- Improve analytics and settlement display
- Add tooltip to pie chart

Adds a tooltip to the pie chart to display information on hover.
- Type errors in AnalyticsCharts
- Split Analytics page into components
- Remove pie chart labels
- Analytics page display issues
- Settlement and summary card calculations
- Split AddRecurringExpenseForm into smaller components
- Refactor expense service and components

Refactor expenseService and related components for improved code organization and maintainability.
- Run SQL migrations
- Update recurring expense form
- Update split type labels
- Remove auth check timeout

Remove the timeout from the authentication check to prevent unwanted logouts.
- Prevent random logouts
- Login page alert variant
- Authentication and dashboard access
- Split useAuthActions into smaller files
- Split AppLayout into smaller components
- Login issue
- Redirect to login after successful login
- Remove signup and policy text, fix online status

Remove signup form and policy text, and fix online status display.
- Remove duplicate useAuth hooks
- Split AppLayout component into smaller files
- Split useAuth hook into modules
- Split user service into modules
- Import AlertCircle from ui/alert
- Break Login page into smaller components
- Handle auth state changes
- Resolve merge conflicts
- Fix Supabase client type error

Fixes a type error in the Supabase client file.
- Fix Supabase RPC call typing

Fixes the typing for the Supabase RPC call to correctly use input and output types.
- Fix Supabase client type error

Fixes a type error in the Supabase client file.
- Supabase client type error
- Supabase client type error
- Supabase client type errors
- Resolve sign-in issues
- Authentication error handling
- Authentication error message
- Show dashboard after login
- Link auth users to user table
- PDF generation error
- Resolve import errors for PDF generation libraries
- Settlement and PDF export issues
- Resolve type errors in ExpenseTableRow
- Split ExpenseTableRow component
- Implement expense and auth features
- Improve expense editing UI
- Improve expense editing experience
- Implement requested UI/UX changes
- Update analytics and settlement features
- Split Settlement page into components
- Split expense service into smaller files
- Split AddExpense.tsx into smaller components
- Use user photo URLs and sort categories/locations
- Update next page
- Dashboard page into smaller components
- Refactor code
- Display blank page issue
- Resolve 504 error
- Remove blank commit
- Add initial project setup

This commit sets up the basic structure and components for the application.
- Remove unnecessary blank commit
- Import FilePdf from lucide-react
- Import FilePdf from lucide-react
- Refresh app with data
- Connect to Supabase project

Add Supabase configuration and types to the project.
- Add AAFairShare expense app

Implement the AAFairShare expense management app with 2-person functionality, integrating with Supabase for data and expenses, and deploying on Netlify.
- Use tech stack vite_react_shadcn_ts

### Chores

- Add git-cliff config for changelog generation
- Add git-cliff config for changelog generation
- Add git-cliff config for changelog generation
- Cleanup redundant files and update docs for email/password auth
- **deps-dev**: Bump @esbuild/darwin-arm64 in the dependencies group
- Bump version to 3.1.0 with full release notes
- Cleanup obsolete code and add CHANGELOG
- Remove .env.production from git tracking
- Update .gitignore - remove supabase, add env patterns
- Bump version to 3.0.0 and fix lint warnings
- Remove CTAs from landing page for private beta
- **deps**: Update jspdf to 3.0.3 and vite to 7.1.12
- **deps**: Bump lucide-react
- Push all uncommitted changes
- **deps**: Bump the dependencies group across 1 directory with 46 updates
- **ci**: Force clean npm cache, node_modules, and package-lock before install
- Update robots.txt to disallow all crawlers
- Remove gptengineer.js script from index.html
- Commit remaining component changes

### Documentation

- Update changelog [skip ci]
- Update changelog [skip ci]
- Update changelog [skip ci]
- Update changelog [skip ci]
- Update changelog [skip ci]
- Update changelog [skip ci]
- Update changelog [skip ci]
- Update version history to v3.4.0
- Update SECURITY_AUDIT.md for email/password auth
- Add comprehensive PWA implementation summary
- Add PWA quick start guide
- Add quick OAuth fix summary
- Add mobile OAuth and error explanation documentation
- Add completed goals feature documentation
- Add comprehensive security and code quality audit report
- Add savings goals setup guide
- Redesign README.md for AAFairShare application

### Features

- Add bill and receipt linking to expenses with multi-select support
- Whitelist-only bank transaction imports
- Add expense automation suite
- Re-enable PDF export using pdf-lib
- **auth**: Migrate login to email/password; remove Google OAuth
- **auth**: Migrate to email/password sign-in and remove Google OAuth references [**BREAKING**]
- **auth**: Switch to credentials-based login with bcrypt password hashing
- **auth**: Migrate to credentials provider with password hashing and seeding [**BREAKING**]
- **audit**: Implement user-links audit action and CLI tool
- Standalone receipt storage independent of expenses
- Receipt storage with camera capture and browsing
- Year-end summary for analytics
- Receipt photo upload for expenses
- Quick add widget, export fixes, and dark mode improvements
- Add dark mode, goal milestones, and monthly savings targets
- Celebration email when savings goal is completed
- Add edit and delete functionality for savings contributions
- Individual contributions for savings goals
- Add Resend email integration for settlement notifications
- Migrate from Supabase to Convex
- Add comprehensive version tracking and build info
- Implement Progressive Web App (PWA) functionality
- Add comprehensive landing page at /landing
- Add completed goals history and enhanced savings goals
- Add savings goals tracker and hide email/password login
- **desktop**: Comprehensive desktop UX improvements and power user features
- **mobile**: Comprehensive mobile UX improvements
- **analytics**: Major improvements to analytics dashboard
- **recurring**: Add status tracking and filtering for recurring expenses
- **analytics**: Complete overhaul of analytics page
- Enhance PDF and CSV settlement reports
- Add indexes to foreign key columns
- Enhance mobile UI and fix logout navigation
- Enhance mobile UI and fix expense actions
- Implement mobile bottom nav, optimize layouts, and fix build
- Add send-settlement-email Deno function
- Configure Deno and VSCode for project
- Add noindex, nofollow meta tag to index.html
- Replace favicon.ico with favicon.svg and update index.html
- Add end date for recurring expenses and fix location deletion check
- Prevent duplicate/in-use deletion for locations and categories
- Update vite to ^6.3.5, resolve esbuild vulnerability
- Add email test data customization
- Show user names in summary card
- Enhance export styling and add email notifications
- Improve form layout for amount and date
- Fetch user data from database
- Implement new features and fixes

### Refactoring

- Unify logout experience via header dropdown
- Replace @vitejs/plugin-react-swc with @vitejs/plugin-react
- Update index.html metadata and remove unused icons
- Remove lovable-tagger

### Security

- Add authentication checks to all Convex mutations
- Address security vulnerabilities


