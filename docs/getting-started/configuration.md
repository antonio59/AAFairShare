# Configuration Guide

> Environment variables and application settings

## Environment Variables

### Frontend Variables (`.env`)

| Variable          | Required | Description           |
| ----------------- | -------- | --------------------- |
| `VITE_CONVEX_URL` | Yes      | Convex deployment URL |

Example `.env`:

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### Convex Environment Variables

Set via `bun x convex env set <KEY> <VALUE>`:

| Variable          | Required | Description                     |
| ----------------- | -------- | ------------------------------- |
| `SITE_URL`        | Yes      | Your app URL for auth redirects |
| `JWT_PRIVATE_KEY` | Yes      | RSA private key for JWT signing |
| `JWKS`            | Yes      | JSON Web Key Set (public keys)  |

## Authentication Setup

### Generating JWT Keys

1. **Generate RSA Key Pair**

   ```bash
   # Generate private key
   openssl genrsa -out private.pem 2048

   # Extract public key
   openssl rsa -in private.pem -pubout -out public.pem
   ```

2. **Convert to JWK Format**
   Use a tool like [mkjwk.org](https://mkjwk.org/) or programmatically convert.

3. **Set in Convex**
   ```bash
   bun x convex env set JWT_PRIVATE_KEY "$(cat private.pem)"
   bun x convex env set JWKS '{"keys":[your-jwk-object]}'
   ```

## User Management

### Creating Users

Users must be pre-seeded in the database. The app uses closed registration for security.

1. **Add user to database** (via Convex dashboard or seed script)
2. **Set password**:
   ```bash
   bun scripts/set-password.ts email@example.com password123
   ```

### User Schema

Users require:

- `email` - Unique email address
- `name` - Display name
- `username` - Unique username
- `passwordHash` - Bcrypt hashed password

## Application Settings

### Theme Configuration

The app supports three themes:

- `light` - Light mode
- `dark` - Dark mode
- `high-contrast` - High contrast mode

Theme preference is stored in localStorage.

### Keyboard Shortcuts

Default shortcuts (can be viewed in app):

| Shortcut       | Action         |
| -------------- | -------------- |
| `Cmd/Ctrl + N` | New Expense    |
| `Cmd/Ctrl + H` | Home/Dashboard |
| `Cmd/Ctrl + S` | Settlement     |
| `Cmd/Ctrl + A` | Analytics      |
| `Cmd/Ctrl + R` | Recurring      |
| `Cmd/Ctrl + G` | Savings Goals  |
| `Cmd/Ctrl + ,` | Settings       |
| `?`            | Show shortcuts |

## Development Settings

### Vite Configuration

Key settings in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-slot", "lucide-react"],
        },
      },
    },
  },
});
```

### TypeScript Configuration

Strict mode enabled with paths alias:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Next Steps

- [First Steps](./first-steps.md) - Start using the app
- [Architecture](../architecture/README.md) - Understand the system
