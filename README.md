# AAFairShare - Expense Management

AAFairShare is a web application designed to help two people easily track and split shared expenses. It provides a clear overview of who paid for what and helps maintain a fair balance.

## Key Features

*   **Expense Tracking:** Log individual expenses with details like amount, date, category, and location.
*   **Recurring Expenses:** Set up recurring expenses (e.g., monthly rent, subscriptions) with an optional end date.
*   **Automatic Splitting:** Expenses are typically split 50/50, with options for custom splits in the future.
*   **User Accounts:** Secure user authentication and data isolation.
*   **Location Management:** Add and manage common expense locations.
*   **Clear Balances:** View who owes whom to easily settle up.
*   **Responsive Design:** Usable across desktop and mobile devices.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **UI:** Tailwind CSS, shadcn/ui
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Edge Functions)
*   **State Management:** React Query (for server state), Zustand (for client state - if applicable, adjust as needed)
*   **Deployment:** Netlify (via GitHub Actions)

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or newer recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/antonio59/fairshare-duo-expenses.git
    cd fairshare-duo-expenses
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Setup

This project uses Supabase for its backend. You'll need to set up a Supabase project and configure your local environment.

1.  Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Obtain your Supabase Project URL and Anon Key:**
    *   Go to your Supabase project dashboard.
    *   Navigate to **Project Settings** > **API**.
    *   Find your **Project URL** and **Project API keys** (use the `anon` public key).

3.  **Update your `.env` file** with these values:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **(Optional) Supabase Edge Functions Secrets:**
    If the project utilizes Supabase Edge Functions that require secrets (e.g., for the `generate-recurring-expenses` function), you'll need to set these up directly in your Supabase project dashboard:
    *   Go to **Edge Functions** > Select your function.
    *   Go to the **Secrets** section to add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (obtained from your Supabase project API settings).

## Running the Development Server

To start the local development server with hot reloading:

```bash
npm run dev
# or
yarn dev
```

This will typically open the application in your default web browser at `http://localhost:5173` (or another port if 5173 is busy).

## Building for Production

To create an optimized production build:

```bash
npm run build
# or
yarn build
```

The production-ready files will be located in the `dist/` directory.

## Deployment

This project is configured for automated deployments to Netlify via GitHub Actions whenever changes are pushed to the `main` branch.

To set this up for your own fork or new Netlify site:

1.  Create a Netlify account at [netlify.com](https://netlify.com).
2.  Create a new site in Netlify, linking it to your Git repository.
3.  In your Netlify site settings, go to **Site settings** > **Build & deploy** > **Environment variables**.
4.  Note your Netlify **Site ID** (from **Site settings** > **General** > **Site details**).
5.  Generate a Netlify personal access token: **User settings** > **Applications** > **Personal access tokens**.
6.  In your GitHub repository settings (**Settings** > **Secrets and variables** > **Actions**), add the following secrets:
    *   `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token.
    *   `NETLIFY_SITE_ID`: Your Netlify Site ID.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details (you'll need to create this file if you want to include the full license text).

---

Contributions are welcome! Please feel free to submit a pull request or open an issue.
