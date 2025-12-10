# AAFairShare - Expense Management

AAFairShare is a web application designed to help two people easily track and split shared expenses. It provides a clear overview of who paid for what and helps maintain a fair balance.

## Key Features

- **Expense Tracking:** Log individual expenses with details like amount, date, category, and location.
- **Recurring Expenses:** Set up recurring expenses (e.g., monthly rent, subscriptions) with an optional end date.
- **Automatic Splitting:** Expenses are typically split 50/50, with options for custom splits.
- **User Accounts:** Secure user authentication via Email/Password.
- **Location Management:** Add and manage common expense locations.
- **Clear Balances:** View who owes whom to easily settle up.
- **Savings Goals:** Track shared savings goals with contribution history.
- **Analytics:** View spending patterns by category and location.
- **Responsive Design:** Usable across desktop and mobile devices.
- **PWA Support:** Installable as a Progressive Web App.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui
- **Backend & Database:** Convex (real-time database with serverless functions)
- **Authentication:** Convex Auth with Email/Password
- **Deployment:** Netlify

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Bun](https://bun.sh/)
- A [Convex](https://convex.dev) account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/antonio59/aafairshare.git
   cd aafairshare
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

### Environment Setup

1. Create a `.env` file in the root of the project:
   ```bash
   cp .env.example .env
   ```

2. **Set up Convex:**
   ```bash
   bun x convex dev
   ```
   This will prompt you to log in and create a new project if needed.

3. **Set Convex environment variables:**
   ```bash
   bun x convex env set SITE_URL "http://localhost:8080"
   ```

4. **Generate JWT keys for authentication:**
   ```bash
   # Generate a private key and set it
   bun x convex env set JWT_PRIVATE_KEY "your-pem-formatted-private-key"
   bun x convex env set JWKS '{"keys":[your-jwk-public-key]}'
   ```

5. **Bootstrap User Passwords:**
   The app is closed to new registrations. You must set passwords for existing email addresses. Use the interactive script to set passwords for both household users:
   ```bash
   bun run set-passwords
   # or
   bun scripts/set-passwords.ts
   ```
   
   The script will prompt you for each user's email and password. Alternatively, you can set a password for a single user:
   ```bash
   bun scripts/set-password.ts user@example.com mysecurepassword
   ```

## Running the Development Server

Start both the Convex backend and frontend dev server:

```bash
# In one terminal, start Convex backend
bun run dev:convex

# In another terminal, start the frontend
bun run dev
```

The application will be available at `http://localhost:8080`.

> **Note**: The `dev:convex` script runs with `--typecheck=disable` to avoid build issues with Convex's TypeScript check. Type safety is still maintained through `bun x tsc --noEmit` and lint checks. See `TYPECHECK_WORKAROUND.md` for details.

## Building for Production

```bash
bun run build
```

The production-ready files will be in the `dist/` directory.

## Deployment

### Convex Backend

Deploy to production:
```bash
bun x convex deploy
```

### Frontend (Netlify)

The project is configured for Netlify deployment. Set these environment variables in Netlify:
- `VITE_CONVEX_URL`: Your Convex deployment URL

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication configuration
│   ├── expenses.ts        # Expense CRUD operations
│   ├── categories.ts      # Category management
│   ├── locations.ts       # Location management
│   ├── settlements.ts     # Settlement tracking
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

## License

This project is licensed under the MIT License.

---

Contributions are welcome! Please feel free to submit a pull request or open an issue.
