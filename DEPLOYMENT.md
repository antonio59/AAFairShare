# AAFairShare Deployment Guide

## Migration Status: Supabase → Pocketbase + Netlify

✅ **Migration Complete** - Your application has been successfully migrated from Supabase to Pocketbase with Netlify Functions.

---

## Architecture Overview

- **Frontend**: React + Vite (PWA enabled)
- **Backend**: Pocketbase (`https://pb.aafairshare.online`)
- **Hosting**: Netlify
- **Email**: Resend (via Netlify Functions)
- **Future**: Usesend migration planned (awaiting API details)

---

## Prerequisites for Deployment

### 1. Pocketbase Setup

Your Pocketbase instance must have these collections configured:

- **users** (id, username, email, avatar, photo_url)
- **expenses** (id, amount, date, month, description, paid_by_id, category_id, location_id, split_type, created_at, updated_at)
- **categories** (id, name, color, icon)
- **locations** (id, name)
- **recurring** (id, amount, description, category_id, location_id, split_type, frequency, start_date, end_date, is_active)
- **shopping_lists** (collection for shopping list items)
- **settlements** (collection for settlement records)

### 2. Environment Variables

#### In Netlify Dashboard (Settings → Environment Variables):

```bash
# Pocketbase Configuration
POCKETBASE_URL=https://pb.aafairshare.online

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=no-reply@aafairshare.online

# Future: Usesend (when ready)
# USESEND_API_KEY=your_usesend_api_key
```

#### In Your Local `.env` file:

```bash
VITE_POCKETBASE_URL=https://pb.aafairshare.online
```

---

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select `antonio59/AAFairShare`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Set Environment Variables**
   - Add the variables listed above in Settings → Environment Variables

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy

### Option 2: Deploy via CLI

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site (first time only)
netlify link

# Set environment variables (first time only)
netlify env:set POCKETBASE_URL "https://pb.aafairshare.online"
netlify env:set RESEND_API_KEY "your_resend_api_key"
netlify env:set EMAIL_FROM "no-reply@aafairshare.online"

# Build and deploy
npm run build
netlify deploy --prod
```

---

## Post-Deployment Verification

### 1. Test Authentication
- Visit your deployed site
- Try logging in with Pocketbase credentials
- Verify user session persists across page reloads

### 2. Test Core Features
- Create an expense
- View expense list
- Test category and location creation
- Check analytics/dashboard

### 3. Test Email Functionality
- Navigate to settlement page
- Generate a settlement report
- Send settlement email
- Verify both users receive the email with PDF and CSV attachments

### 4. Test PWA Features
- On mobile: Add to home screen
- Test offline functionality
- Verify service worker registration

---

## Troubleshooting

### Build Fails

**Error**: `Cannot find module 'pocketbase'`
- **Solution**: Run `npm install` to ensure all dependencies are installed

**Error**: TypeScript errors
- **Solution**: Run `npm run lint` to identify issues

### Authentication Issues

**Error**: "Cannot connect to authentication service"
- **Solution**: Verify `VITE_POCKETBASE_URL` is correct in environment variables
- Check Pocketbase instance is running and accessible

### Email Not Sending

**Error**: "Email service not configured"
- **Solution**: Set `RESEND_API_KEY` in Netlify environment variables
- Verify Resend API key is valid and has sending permissions

**Error**: "Failed to fetch user data"
- **Solution**: Ensure Pocketbase `POCKETBASE_URL` is set in Netlify Functions environment
- Verify user IDs exist in Pocketbase

### 404 on Routes

**Issue**: Direct navigation to routes like `/dashboard` returns 404
- **Solution**: The `netlify.toml` redirect rule should handle this
- If still occurring, add this to `netlify.toml`:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

---

## Migration to Usesend (Future)

When Usesend API details are available:

1. **Update Netlify Function** (`netlify/functions/send-settlement-email.ts`):
   ```typescript
   // Replace Resend initialization
   const usesendApiKey = process.env.USESEND_API_KEY
   
   // Update email sending logic to use Usesend API
   // Refer to Usesend documentation for specific implementation
   ```

2. **Update Environment Variables**:
   - Add `USESEND_API_KEY` to Netlify
   - Optionally keep `RESEND_API_KEY` as fallback during transition

3. **Test Thoroughly**:
   - Verify email delivery
   - Check attachment handling
   - Confirm HTML rendering

---

## Monitoring & Maintenance

### Netlify Functions Logs
- View function execution logs: Netlify Dashboard → Functions → View logs
- Monitor email sending success/failure rates

### Pocketbase Health
- Check Pocketbase instance status: `https://pb.aafairshare.online/api/health`
- Monitor authentication success rates

### PWA Updates
- When you deploy updates, users will automatically receive the new version
- The service worker handles cache invalidation

---

## Security Checklist

✅ All sensitive keys stored in environment variables (not in code)  
✅ Pocketbase uses HTTPS  
✅ Email API keys secured in Netlify environment  
✅ No hardcoded credentials in repository  
✅ CORS properly configured for Pocketbase  

---

## Support & Resources

- **Pocketbase Docs**: https://pocketbase.io/docs/
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Resend API**: https://resend.com/docs
- **PWA Guide**: https://vite-pwa-org.netlify.app/

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Deploy to Netlify
netlify deploy --prod

# View Netlify logs
netlify functions:log send-settlement-email
```

---

**Last Updated**: 2025-11-13  
**Migration Status**: Complete ✅  
**Next Steps**: Deploy to Netlify and test thoroughly
