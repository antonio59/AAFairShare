# Deployment Guide

> Production deployment for AAFairShare

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Netlify CDN    │────▶│  Convex Cloud   │
│  (Frontend)     │     │  (Backend)      │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
        │                       │
        │    HTTPS/WSS          │
        ▼                       ▼
┌─────────────────────────────────────────┐
│              User Browser               │
└─────────────────────────────────────────┘
```

## Deployment Services

| Service      | Purpose            | URL         |
| ------------ | ------------------ | ----------- |
| Netlify      | Frontend hosting   | netlify.com |
| Convex Cloud | Backend + Database | convex.dev  |

## Prerequisites

- Convex account with production deployment
- Netlify account
- GitHub repository connected

---

## Backend Deployment (Convex)

### 1. Create Production Deployment

```bash
# Deploy to production
bun x convex deploy
```

This creates a production Convex deployment separate from development.

### 2. Set Production Environment Variables

```bash
# Set production site URL
bun x convex env set SITE_URL "https://your-app.netlify.app" --prod

# Set JWT keys (same as dev or generate new)
bun x convex env set JWT_PRIVATE_KEY "..." --prod
bun x convex env set JWKS "..." --prod
```

### 3. Verify Deployment

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Check "Production" deployment
4. Verify functions are deployed

---

## Frontend Deployment (Netlify)

### 1. Connect Repository

1. Log in to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import existing project"
3. Connect GitHub and select repository
4. Configure build settings:

| Setting           | Value           |
| ----------------- | --------------- |
| Build command     | `bun run build` |
| Publish directory | `dist`          |
| Node version      | `20`            |

### 2. Set Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Variable          | Value                      |
| ----------------- | -------------------------- |
| `VITE_CONVEX_URL` | Your production Convex URL |

### 3. Deploy

Netlify auto-deploys on push to `main` branch.

Manual deploy:

```bash
bun run build
# Then drag dist/ to Netlify, or use CLI:
netlify deploy --prod --dir=dist
```

---

## CI/CD Pipeline

### GitHub Actions

The project includes CI workflows in `.github/workflows/`:

| Workflow              | Trigger      | Purpose               |
| --------------------- | ------------ | --------------------- |
| `code-quality.yml`    | Push/PR      | Lint, typecheck, test |
| `netlify-deploy.yml`  | Push to main | Deploy frontend       |
| `codeql-analysis.yml` | Schedule     | Security scanning     |
| `npm-audit.yml`       | Schedule     | Dependency audit      |

### Workflow: code-quality.yml

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun test
```

---

## Environment Configuration

### Development vs Production

| Setting    | Development           | Production             |
| ---------- | --------------------- | ---------------------- |
| Convex URL | `.convex.cloud` (dev) | `.convex.cloud` (prod) |
| Site URL   | `localhost:8080`      | `your-app.netlify.app` |
| Debug logs | Enabled               | Disabled               |

### netlify.toml

```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## Domain Setup

### Custom Domain on Netlify

1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   - Add CNAME record pointing to Netlify
   - Or use Netlify DNS

### SSL Certificate

Netlify provides automatic SSL via Let's Encrypt.

---

## Monitoring

### Convex Monitoring

- **Dashboard**: View function logs and errors
- **Usage**: Monitor database and function usage
- **Alerts**: Set up usage alerts

### Netlify Analytics

- **Page views**: Traffic analytics
- **Build logs**: Deployment history
- **Function logs**: Serverless function logs

---

## Rollback

### Frontend (Netlify)

1. Go to Deploys
2. Find previous deploy
3. Click "Publish deploy"

### Backend (Convex)

1. Go to Convex Dashboard
2. View deployment history
3. Redeploy previous version

---

## Security Checklist

- [ ] Production JWT keys are different from dev
- [ ] Environment variables are set (not in code)
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] No sensitive data in logs
- [ ] Dependencies audited

---

## Troubleshooting

### Build Failures

| Error            | Solution                         |
| ---------------- | -------------------------------- |
| Missing env var  | Set `VITE_CONVEX_URL` in Netlify |
| TypeScript error | Fix locally, push again          |
| Dependency error | Clear cache, reinstall           |

### Runtime Errors

| Error             | Solution                |
| ----------------- | ----------------------- |
| Convex connection | Check production URL    |
| Auth failures     | Verify JWT keys in prod |
| CORS errors       | Check Site URL matches  |

---

## Documentation

| Document                                       | Description            |
| ---------------------------------------------- | ---------------------- |
| [Convex Setup](./convex-setup.md)              | Detailed Convex guide  |
| [Netlify Setup](./netlify-setup.md)            | Detailed Netlify guide |
| [Environment Variables](./environment-vars.md) | All env vars           |

---

## Quick Commands

```bash
# Deploy backend
bun x convex deploy

# Build frontend
bun run build

# Deploy frontend (if using Netlify CLI)
netlify deploy --prod --dir=dist

# Check production logs
bun x convex logs --prod
```
