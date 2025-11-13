# Final Setup Checklist

## ✅ What's Complete

- ✅ Google OAuth button added to login page
- ✅ Supabase keep-alive working (84 successful runs)
- ✅ Code deployed to Netlify
- ✅ All data safe in Supabase
- ✅ Heartbeat function deployed

---

## ⚠️ What You Need to Complete

### 1. Google Console Configuration (5 minutes)

**Follow**: `GOOGLE_OAUTH_SETUP.md`

**Quick steps:**

1. Go to: https://console.cloud.google.com/apis/credentials

2. Edit your OAuth 2.0 Client ID

3. **Add these Authorized redirect URIs**:
   ```
   https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
   https://aafairshare.online/auth/callback
   http://localhost:8080/auth/callback
   ```

4. Save

---

### 2. Supabase Google Provider Configuration (5 minutes)

1. **Go to Supabase**: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/providers

2. **Find Google** in the providers list

3. **Click to enable** and configure:
   - Enable toggle: ON
   - Client ID: (from Google Console)
   - Client Secret: (from Google Console)

4. **Save**

5. **Set Site URL**: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/url-configuration
   - Site URL: `https://aafairshare.online`
   - Redirect URLs: `https://aafairshare.online/**`

---

### 3. Disable Email/Password in Supabase (Optional)

If you ONLY want Google OAuth:

1. **Go to**: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/providers

2. **Find "Email" provider**

3. **Disable it** (toggle off)

**OR** keep both enabled so users can choose either method.

---

### 4. Fix Domain Redirect (if not done)

If `aafairshare.online` still redirects to registrar:

**In your DNS provider:**
```
A record:     @     →  75.2.60.5
CNAME record: www   →  your-netlify-subdomain.netlify.app
```

**In Netlify Dashboard:**
- Add custom domain: `aafairshare.online`
- Enable HTTPS
- Force HTTPS: ON

---

## 🧪 Testing

### Test Google OAuth

1. **Go to**: https://aafairshare.online/login (or your domain)

2. **You should see**:
   - "Continue with Google" button (blue with Google logo)
   - Divider line: "Or continue with email"
   - Email/password fields below

3. **Click "Continue with Google"**

4. **Should redirect to Google login**

5. **After login, redirects back to your app**

6. **You're logged in!** ✅

### Test Email/Password (if enabled)

1. Use email/password fields

2. Should work as before

---

## 🎯 Current Status

| Item | Status | Action Needed |
|------|--------|---------------|
| Code deployed | ✅ Complete | None |
| Google button visible | ✅ Complete | None |
| Keep-alive working | ✅ Complete | None |
| Data in Supabase | ✅ Safe | None |
| Google Console redirect URIs | ❌ Needs setup | Add 3 URIs |
| Supabase Google provider | ❌ Needs config | Enable + add credentials |
| Domain working | ❓ Check | May need DNS fix |

---

## 🚀 Quick Start

**To get Google OAuth working right now:**

1. **Add redirect URIs in Google Console** (2 min)
2. **Enable Google provider in Supabase** (2 min)
3. **Test login** (1 min)

**Total time: ~5 minutes**

---

## 📱 What Your Login Page Looks Like Now

```
┌─────────────────────────────────┐
│     AAFairShare                 │
│  Track and split expenses fairly│
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔵 Continue with Google   │ │
│  └───────────────────────────┘ │
│                                 │
│  ─── Or continue with email ─── │
│                                 │
│  Email                          │
│  [you@example.com        ]      │
│                                 │
│  Password        Forgot?        │
│  [••••••••••             ]      │
│                                 │
│  [Sign in with Email]           │
└─────────────────────────────────┘
```

---

## 📚 Documentation Reference

| Guide | Purpose |
|-------|---------|
| `GOOGLE_OAUTH_SETUP.md` | Configure Google OAuth |
| `SUPABASE_KEEP_ALIVE_SETUP.md` | Keep Supabase active |
| `VERIFY_KEEP_ALIVE.md` | Verify keep-alive works |
| `FINAL_SETUP_CHECKLIST.md` | This file |

---

## ✅ Success Criteria

Your setup is complete when:

- [ ] Google "Continue with Google" button appears on login
- [ ] Clicking it redirects to Google login
- [ ] After Google login, redirects back to your app
- [ ] User is logged in and sees dashboard
- [ ] Keep-alive shows green checkmarks in GitHub Actions
- [ ] Domain `aafairshare.online` loads your app (not registrar)

---

## 🎉 Almost Done!

You're just **5 minutes away** from having Google OAuth working!

1. Add redirect URIs in Google Console
2. Configure Google provider in Supabase
3. Test it!

**Your Supabase will never pause (keep-alive is working), and users can sign in with Google!** 🚀

---

## Need Help?

- **Google OAuth not working?** → See `GOOGLE_OAUTH_SETUP.md` troubleshooting section
- **Keep-alive failing?** → See `VERIFY_KEEP_ALIVE.md`
- **Domain issues?** → Check DNS settings and Netlify configuration
