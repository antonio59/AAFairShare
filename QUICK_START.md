# Quick Start - Deployment

## 🚀 Your site is ready to deploy!

### Prerequisites Checklist

- ✅ Pocketbase running at `https://pb.aafairshare.online`
- ⚠️ Resend API key (get from https://resend.com)
- ⚠️ Netlify account connected to GitHub

---

## Deploy in 3 Steps

### 1️⃣ Set Netlify Environment Variables

Go to **Netlify Dashboard** → **Site Settings** → **Environment Variables** and add:

```
POCKETBASE_URL=https://pb.aafairshare.online
RESEND_API_KEY=(your resend api key)
EMAIL_FROM=no-reply@aafairshare.online
```

### 2️⃣ Push to GitHub

```bash
git add .
git commit -m "Migrate from Supabase to Pocketbase

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
git push origin main
```

### 3️⃣ Netlify Auto-Deploys

Netlify will automatically:
- Detect the push
- Run `npm run build`
- Deploy to production
- Your site will be live!

---

## Test Your Site

After deployment:

1. **Login**: Try logging in with your Pocketbase credentials
2. **Create Expense**: Add a test expense
3. **Send Email**: Test settlement email (if you have RESEND_API_KEY set)

---

## Need Help?

- **Full Guide**: See `DEPLOYMENT.md`
- **Migration Details**: See `MIGRATION_SUMMARY.md`
- **Issues**: Check Netlify function logs

---

## What Changed?

- ❌ Removed: Supabase
- ✅ Added: Pocketbase backend
- ✅ Added: Netlify Functions for email
- ✅ PWA support maintained
- 🔄 Future: Usesend email (when ready)

---

**Your app is migration-complete and ready to go live! 🎉**
