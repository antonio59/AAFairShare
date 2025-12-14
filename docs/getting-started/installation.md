# Installation Guide

> Complete step-by-step installation instructions

## Prerequisites

### Required Software

1. **Node.js v18+**

   ```bash
   # Check version
   node --version

   # Install via nvm (recommended)
   nvm install 20
   nvm use 20
   ```

2. **Bun**

   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash

   # Verify installation
   bun --version
   ```

3. **Git**
   ```bash
   git --version
   ```

### Accounts Required

- **Convex Account** - Sign up at [convex.dev](https://convex.dev)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/antonio59/aafairshare.git
cd aafairshare
```

### 2. Install Dependencies

```bash
bun install
```

This installs all required npm packages including:

- React and React DOM
- Convex client and auth
- shadcn/ui components
- Tailwind CSS
- TypeScript

### 3. Set Up Environment

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Initialize Convex

Run the Convex development command:

```bash
bun x convex dev
```

This will:

1. Prompt you to log in to Convex (opens browser)
2. Create a new project or connect to existing one
3. Deploy your schema and functions
4. Start watching for changes

### 5. Configure Authentication

Set the required Convex environment variables:

```bash
# Set the site URL for auth redirects
bun x convex env set SITE_URL "http://localhost:8080"
```

For JWT authentication, generate and set keys:

```bash
# Generate RSA key pair (use OpenSSL or online tool)
# Then set the private key
bun x convex env set JWT_PRIVATE_KEY "-----BEGIN RSA PRIVATE KEY-----
...your key...
-----END RSA PRIVATE KEY-----"

# Set the public key in JWKS format
bun x convex env set JWKS '{"keys":[...]}'
```

### 6. Seed User Accounts

The app uses closed registration. Create user passwords:

```bash
bun scripts/set-password.ts user@example.com yourpassword
```

### 7. Start Development Server

```bash
bun run dev
```

Visit `http://localhost:8080` in your browser.

## Verification

After installation, verify everything works:

1. **Frontend loads** - You should see the login page
2. **Convex connected** - No console errors about Convex
3. **Auth works** - Can log in with seeded credentials

## Troubleshooting

### Common Issues

**"VITE_CONVEX_URL is required"**

- Ensure `.env` file exists with `VITE_CONVEX_URL` set
- Or run `bun x convex dev` which sets it automatically

**"Cannot connect to Convex"**

- Check your internet connection
- Verify Convex project exists in dashboard
- Re-run `bun x convex dev`

**"Invalid credentials"**

- Run the password seed script for your user
- Check email is correct (case-sensitive)

## Next Steps

- [Configuration Guide](./configuration.md) - Advanced configuration
- [First Steps](./first-steps.md) - Start using the app
