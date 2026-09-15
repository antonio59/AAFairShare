# Deployment Guide

> Production deployment for AAFairShare

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Cloudflare     │────▶│  Convex Cloud   │
│  Pages (CDN)    │     │  (Backend)      │
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

| Service         | Purpose            | URL            |
| --------------- | ------------------ | -------------- |
| Cloudflare      | Frontend hosting   | cloudflare.com |
| Convex Cloud    | Backend + Database | convex.dev     |

## Prerequisites

- Convex account with production deployment
- Cloudflare account with Pages enabled
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
bun x convex env set SITE_URL "https://your-app.pages.dev" --prod

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

## Frontend Deployment (Cloudflare Pages)

### 1. Connect Repository

1. Log in to [Cloudflare dashboard](https://dash.cloudflare.com)
2. Workers & Pages → Create → Pages → Connect to Git
3. Select repository and configure build settings:

| Setting                | Value              |
| ---------------------- | ------------------ |
| Framework preset       | `Vite`             |
| Build command          | `pnpm run build`   |
| Build output directory | `dist`             |

### 2. Set Environment Variables

In Pages project → Settings → Environment variables:

| Variable          | Value                      |
| ----------------- | -------------------------- |
| `VITE_CONVEX_URL` | Your production Convex URL |

### 3. Deploy

Cloudflare Pages auto-deploys on push to `main` (production branch).

Manual deploy:

```bash
pnpm run build
npx wrangler pages deploy dist
```

---

## Headers & SPA Routing

- `public/_headers` ships security headers (`CSP`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) plus long-lived caching for `/assets/*`.
- SPA fallback is handled by `public/_redirects` (`/*  /index.html  200`) — Cloudflare Pages supports this file natively.
- Alternatively, enable the built-in **SPA mode** in the Pages project settings.

---

## CI/CD Pipeline

### GitHub Actions

The project includes CI workflows in `.github/workflows/`:

| Workflow                   | Trigger      | Purpose                        |
| -------------------------- | ------------ | ------------------------------ |
| `ci.yml`                   | Push/PR      | Lint, typecheck, test, deploy  |
| `security-and-quality.yml` | Push/PR      | Security scanning              |
| `dependency-review.yml`    | PR           | Dependency review              |
| `changelog.yml`            | Release      | Changelog generation           |

Deploys can run through the Cloudflare GitHub integration or via `wrangler pages deploy` in CI using `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets.

---

## Environment Configuration

### Development vs Production

| Setting    | Development           | Production             |
| ---------- | --------------------- | ---------------------- |
| Convex URL | `.convex.cloud` (dev) | `.convex.cloud` (prod) |
| Site URL   | `localhost:8080`      | `your-app.pages.dev`   |
| Debug logs | Enabled               | Disabled               |

---

## Domain Setup

### Custom Domain on Cloudflare Pages

1. Pages project → Custom domains → Set up a custom domain
2. If the zone is on Cloudflare DNS, the record is added automatically
3. Otherwise, create a `CNAME` pointing to `<project>.pages.dev`

### SSL Certificate

Cloudflare provides automatic TLS for Pages domains and custom domains.

---

## Monitoring

### Convex Monitoring

- **Dashboard**: View function logs and errors
- **Usage**: Monitor database and function usage
- **Alerts**: Set up usage alerts

### Cloudflare Analytics

- **Web Analytics**: Privacy-first traffic analytics
- **Build logs**: Deployment history in Pages project
- **Zero Trust (optional)**: Add Access policies in front of the app for a private site

---

## Rollback

### Frontend (Cloudflare Pages)

1. Pages project → Deployments
2. Find previous deployment
3. Select "Rollback to this deployment"

### Backend (Convex)

1. Go to Convex Dashboard
2. View deployment history
3. Redeploy previous version

---

## Security Checklist

- [ ] Production JWT keys are different from dev
- [ ] Environment variables are set (not in code)
- [ ] HTTPS enabled
- [ ] Security headers present (verify `_headers` deploys)
- [ ] Rate limiting configured
- [ ] No sensitive data in logs
- [ ] Dependencies audited
- [ ] Optional: Cloudflare Access policy restricts the app to allow-listed emails

---

## Troubleshooting

### Build Failures

| Error            | Solution                                |
| ---------------- | --------------------------------------- |
| Missing env var  | Set `VITE_CONVEX_URL` in Pages settings |
| TypeScript error | Fix locally, push again                 |
| Dependency error | Clear cache, reinstall                  |

### Runtime Errors

| Error             | Solution                |
| ----------------- | ----------------------- |
| Convex connection | Check production URL    |
| Auth failures     | Verify JWT keys in prod |
| CORS errors       | Check Site URL matches  |

---

## Quick Commands

```bash
# Deploy backend
bun x convex deploy

# Build frontend
pnpm run build

# Deploy frontend (manual)
npx wrangler pages deploy dist

# Check production logs
bun x convex logs --prod
```
