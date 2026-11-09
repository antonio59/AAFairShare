# AAFairShare - Expense Management

AAFairShare is a web application designed to help two people easily track and split shared expenses. It provides a clear overview of who paid for what and helps maintain a fair balance.

## Key Features

- **Expense Tracking:** Log individual expenses with details like amount, date, category, and location.
- **Recurring Expenses:** Set up recurring expenses (e.g., monthly rent, subscriptions) with an optional end date.
- **Automatic Splitting:** Expenses are split 50/50, or marked as owed in full by the other person.
- **User Accounts:** Secure user authentication via Email/Password.
- **Location Management:** Add and manage common expense locations.
- **Clear Balances:** View who owes whom, worked out in whole pence, and settle up each month. Settled months are protected from changes.
- **Shared Refund Credits:** Record a refund on a shared bill once. New household bills use it automatically, oldest credit first, and unused credit is shown separately from what is owed. See [docs/features/refund-credits.md](docs/features/refund-credits.md).
- **Activity Feed:** A searchable history of who added, changed or settled what, with a Refunds filter.
- **Two-Person Household:** Built for exactly two people; neither person nor their sign-in can be deleted.
- **Savings Goals:** Track shared savings goals with contribution history.
- **Analytics:** View spending patterns by category and location.
- **Responsive Design:** Usable across desktop and mobile devices.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui
- **Backend & Database:** Convex (real-time database with serverless functions)
- **Authentication:** Convex Auth with Email/Password
- **Deployment:** Cloudflare Pages

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or newer — required by `engines`)
- [pnpm](https://pnpm.io/)
- A [Convex](https://convex.dev) account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/antonio59/aafairshare.git
   cd aafairshare
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Environment Setup

1. Create a `.env` file in the root of the project:
   ```bash
   cp .env.example .env
   ```

2. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create a new project if needed.

3. **Set Convex environment variables:**
   ```bash
   npx convex env set SITE_URL "http://localhost:8080"
   ```

4. **Generate JWT keys for authentication:**
   ```bash
   # Generate a private key and set it
   npx convex env set JWT_PRIVATE_KEY "your-pem-formatted-private-key"
   npx convex env set JWKS '{"keys":[your-jwk-public-key]}'
   ```

5. **Seed User Passwords:**
   The app is closed to new registrations. You must set passwords for existing email addresses via the seeding script:
   ```bash
   pnpm exec tsx scripts/set-password.ts user@example.com mysecurepassword
   ```

## Running the Development Server

Start both the Convex backend and frontend dev server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:8080`.

## Building for Production

```bash
pnpm run build
```

The production-ready files will be in the `dist/` directory.

## Deployment

### Convex Backend

Deploy to production:
```bash
npx convex deploy
```

### Frontend (Cloudflare Pages)

The frontend builds to `dist/` and deploys to Cloudflare Pages:

```bash
pnpm run build
npx wrangler pages deploy dist
```

Configure in the Cloudflare Pages project settings:
- **Build command:** `pnpm run build`
- **Build output directory:** `dist`
- **Environment variable:** `VITE_CONVEX_URL` — your Convex deployment URL

`public/_headers` ships security headers and cache policy; SPA fallback is handled by Pages' built-in SPA mode or `public/_redirects`.

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication configuration
│   ├── expenses.ts        # Expense CRUD operations
│   ├── categories.ts      # Category management
│   ├── locations.ts       # Location management
│   ├── settlements.ts     # Settlement tracking
│   ├── credits.ts         # Shared refund credits
│   ├── savingsGoals.ts    # Savings goals feature
│   ├── monthData.ts       # Monthly aggregations
│   └── analytics.ts       # Spending analytics
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks including Convex data hooks
│   ├── providers/         # Context providers
│   └── types/             # TypeScript types
└── public/                # Static assets
```

## Versions and Release Notes

The version number lives in `package.json` and is shown in the app under Settings → About, next to the version history from `src/lib/version.ts`. `CHANGELOG.md` is regenerated from `cliff.toml` on every push to `main`, so write release notes in the `cliff.toml` header, not in `CHANGELOG.md`.

When a change is user-facing, bump `package.json` (semver) and add a matching entry to both `VERSION_HISTORY` and the `cliff.toml` header. `src/lib/version.test.ts` fails if they disagree.

## License

This project is licensed under the MIT License.

---

Contributions are welcome! Please feel free to submit a pull request or open an issue.
