# Post-Migration Checklist

## ✅ Code Migration Complete

Your code has been successfully migrated and pushed to GitHub!

---

## ⚠️ CRITICAL: Before Your Site Can Go Live

### Step 1: Set Up Pocketbase Collections

**Status**: ❌ REQUIRED  
**Priority**: HIGH

Your Pocketbase instance at `https://pb.aafairshare.online` needs these collections created:

1. **Open Pocketbase Admin**: https://pb.aafairshare.online/_/
2. **Follow the guide**: See `POCKETBASE_SCHEMA.md`
3. **Create 7 collections**:
   - [ ] `users` (Auth collection)
   - [ ] `categories`
   - [ ] `locations`
   - [ ] `expenses`
   - [ ] `recurring`
   - [ ] `settlements`
   - [ ] `shopping_lists`

**Quick check**: Can you see all collections in the Pocketbase admin panel?

---

### Step 2: Migrate Data from Supabase

**Status**: ❌ REQUIRED (if you have existing data)  
**Priority**: HIGH

If you have existing data in Supabase that needs to be transferred:

1. **Set environment variables** in your `.env` file:
   ```bash
   # Add these to your .env
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   # OR (better for migration)
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=your_admin_password
   ```

2. **Install Supabase client** (temporarily for migration):
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Run migration script**:
   ```bash
   node scripts/migrate-supabase-to-pocketbase.js
   ```

4. **Verify in Pocketbase admin**: Check that all data appears correctly

5. **Uninstall Supabase client** (cleanup):
   ```bash
   npm uninstall @supabase/supabase-js
   ```

**Note**: If you're starting fresh (no existing data), you can skip this step!

---

### Step 3: Configure Netlify Environment Variables

**Status**: ❌ REQUIRED  
**Priority**: HIGH

Go to your Netlify Dashboard → Site Settings → Environment Variables

Add these variables:

```bash
# Pocketbase connection (for Netlify Functions)
POCKETBASE_URL=https://pb.aafairshare.online

# Email service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=no-reply@aafairshare.online
```

**Where to get Resend API key:**
1. Go to https://resend.com
2. Sign up / Log in
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into Netlify

---

### Step 4: Netlify Deployment

**Status**: ✅ Already triggered!  
**Action**: Monitor the deployment

Since you pushed to GitHub, Netlify should auto-deploy:

1. **Check Netlify Dashboard**: https://app.netlify.com
2. **Watch the build**: Should see "Building" status
3. **Wait for completion**: Takes ~2-3 minutes
4. **Check for errors**: If build fails, check the logs

**Common issues:**
- Missing environment variables → Set in Netlify dashboard
- Build errors → Check Netlify function logs

---

### Step 5: Test Your Live Site

**Status**: ⏳ Pending deployment  
**Priority**: HIGH

Once deployed, test these features:

#### Authentication
- [ ] Can you log in with Pocketbase credentials?
- [ ] Does session persist after page reload?
- [ ] Does logout work correctly?

#### Core Features
- [ ] Create a new expense
- [ ] View expense list
- [ ] Create categories and locations
- [ ] View analytics/dashboard

#### Email (if RESEND_API_KEY is set)
- [ ] Go to settlement page
- [ ] Send a test settlement email
- [ ] Verify email arrives with PDF and CSV attachments

#### PWA
- [ ] On mobile: Can you "Add to Home Screen"?
- [ ] Does the app icon appear correctly?
- [ ] Does it launch in standalone mode?

---

## 📋 Summary of What You Need to Do

### REQUIRED (High Priority):

1. ✅ ~~Code pushed to GitHub~~ (DONE)
2. ❌ **Create Pocketbase collections** (see `POCKETBASE_SCHEMA.md`)
3. ❌ **Set Netlify environment variables** (POCKETBASE_URL, RESEND_API_KEY, EMAIL_FROM)
4. ⏳ **Wait for Netlify deployment** (auto-triggered)
5. ❌ **Test the live site** (see checklist above)

### OPTIONAL (If you have existing data):

6. ❌ **Run data migration script** (see Step 2 above)

### FUTURE:

7. ⏸️ **Switch to Usesend email** (when you get API details)

---

## 🆘 Troubleshooting

### Site not loading
- Check Netlify deployment logs
- Verify environment variables are set
- Check browser console for errors

### Authentication fails
- Verify Pocketbase is accessible: https://pb.aafairshare.online/api/health
- Check Pocketbase collections are created
- Ensure users exist in Pocketbase

### Email not sending
- Verify `RESEND_API_KEY` is set in Netlify
- Check Netlify Function logs for errors
- Test Resend API key directly in their dashboard

### Data missing
- If you skipped migration, you'll need to create test data manually
- Or run the migration script (Step 2)

---

## 📞 Quick Reference

| Resource | Link |
|----------|------|
| Pocketbase Admin | https://pb.aafairshare.online/_/ |
| Netlify Dashboard | https://app.netlify.com |
| Resend Dashboard | https://resend.com/emails |
| GitHub Repo | https://github.com/antonio59/AAFairShare |

---

## ✨ Next Steps After Site is Live

1. **Monitor performance**: Check Netlify analytics
2. **Set up error tracking**: Consider adding Sentry
3. **Backup strategy**: Regular Pocketbase backups
4. **User password resets**: If you migrated data, users have default password "changeme123"
5. **Plan Usesend migration**: When API details are available

---

**Questions?** Refer to:
- `QUICK_START.md` - Quick deployment guide
- `DEPLOYMENT.md` - Comprehensive deployment documentation
- `MIGRATION_SUMMARY.md` - What changed in the migration
- `POCKETBASE_SCHEMA.md` - Database schema setup

---

**Your site will be live once you complete steps 2-5!** 🚀
