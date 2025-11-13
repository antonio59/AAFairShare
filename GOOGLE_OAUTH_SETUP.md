# Google OAuth Setup for Supabase

## What You Need to Update in Google Console

Your Google OAuth credentials need to include Supabase's callback URL.

---

## Step 1: Find Your Supabase Callback URL

Your Supabase callback URL is:
```
https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
```

---

## Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Select your project** (or create one if needed)

3. **Navigate to**: APIs & Services → Credentials
   - Direct link: https://console.cloud.google.com/apis/credentials

4. **Find your OAuth 2.0 Client ID**
   - If you don't have one, click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**

5. **Click Edit** (pencil icon) on your OAuth client

6. **Add Authorized redirect URIs**:
   
   Add these URIs:
   ```
   https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
   https://aafairshare.online/auth/callback
   http://localhost:8080/auth/callback
   ```
   
   **Explanation:**
   - First URI: Supabase handles OAuth and redirects back
   - Second URI: Your production domain callback
   - Third URI: Local development

7. **Authorized JavaScript origins** (optional but recommended):
   ```
   https://aafairshare.online
   http://localhost:8080
   ```

8. **Click Save**

9. **Copy your credentials**:
   - **Client ID**: (starts with something like `123456789-xxx.apps.googleusercontent.com`)
   - **Client Secret**: (a random string)

---

## Step 3: Configure Supabase with Google OAuth

1. **Go to Supabase Dashboard**: https://app.supabase.com/project/gsvyxsddmddipeoduyys

2. **Navigate to**: Authentication → Providers

3. **Find Google** in the list

4. **Enable Google provider**

5. **Add your credentials**:
   - **Client ID**: (from Google Console)
   - **Client Secret**: (from Google Console)

6. **Configure additional settings** (optional):
   - **Skip nonce check**: Leave disabled (more secure)
   - **Redirect URL**: Should show your Supabase callback URL

7. **Save**

---

## Step 4: Update Site URL in Supabase

1. **In Supabase Dashboard**: Authentication → URL Configuration

2. **Set Site URL**:
   ```
   https://aafairshare.online
   ```

3. **Add Redirect URLs** (comma-separated):
   ```
   https://aafairshare.online/**,
   http://localhost:8080/**
   ```

4. **Save**

---

## Step 5: Test Google Login

### In Development (localhost):

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:8080/login`

3. Click "Sign in with Google"

4. Should redirect to Google login

5. After login, should redirect back to your app

### In Production:

1. Go to: `https://aafairshare.online/login`

2. Click "Sign in with Google"

3. Should work the same way

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in Google Console doesn't match what Supabase is sending

**Fix**:
1. Check the exact error message for the URI being used
2. Add that exact URI to Google Console → Authorized redirect URIs
3. Common URIs to add:
   ```
   https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
   https://aafairshare.online/auth/callback
   ```

### Error: "Access blocked: Authorization Error"

**Cause**: OAuth consent screen not configured

**Fix**:
1. Google Console → APIs & Services → OAuth consent screen
2. Fill in required fields:
   - App name: AAFairShare
   - User support email: (your email)
   - Developer contact: (your email)
3. Add scopes: email, profile, openid
4. Save and continue
5. Add test users (if in testing mode)

### Error: "Invalid OAuth client"

**Cause**: Client ID or Secret incorrect

**Fix**:
1. Double-check Client ID and Secret from Google Console
2. Re-copy them to Supabase (no extra spaces)
3. Save in Supabase

### Users can't sign in after adding OAuth

**Issue**: Email/password users can't log in anymore

**Solution**: Both methods work independently:
- Email/password login still works (if enabled in Supabase Auth settings)
- Google OAuth is an additional option
- Users can use either method

---

## Security Best Practices

### 1. OAuth Consent Screen

Set up properly in Google Console:
- **User type**: External (for public app)
- **App name**: AAFairShare
- **App logo**: Upload your logo
- **Scopes**: email, profile, openid (basic scopes)
- **Authorized domains**: Add `aafairshare.online`

### 2. Restrict API Keys

If using Google API keys elsewhere:
- Google Console → Credentials → API Keys
- Add application restrictions
- Add website restrictions to your domains

### 3. Monitor Usage

- Google Console → APIs & Services → Dashboard
- Check OAuth 2.0 usage
- Set up alerts for unusual activity

---

## OAuth Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Redirects to: https://accounts.google.com/...
    ↓
User logs in with Google
    ↓
Google redirects to: https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
    ↓
Supabase creates/updates user
    ↓
Supabase redirects to: https://aafairshare.online/
    ↓
User is logged in ✅
```

---

## Common URLs Reference

| Purpose | URL |
|---------|-----|
| Google Console Credentials | https://console.cloud.google.com/apis/credentials |
| OAuth Consent Screen | https://console.cloud.google.com/apis/credentials/consent |
| Supabase Auth Settings | https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/providers |
| Supabase URL Config | https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/url-configuration |

---

## Quick Checklist

Before Google OAuth works:

- [ ] Google OAuth client created in Google Console
- [ ] Supabase callback URL added to authorized redirect URIs
- [ ] Client ID and Secret copied to Supabase
- [ ] Google provider enabled in Supabase
- [ ] Site URL configured in Supabase
- [ ] OAuth consent screen configured
- [ ] Test in development (localhost)
- [ ] Test in production (aafairshare.online)

---

## Summary

**What to add in Google Console:**
```
Authorized redirect URIs:
✓ https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
✓ https://aafairshare.online/auth/callback
✓ http://localhost:8080/auth/callback
```

**What to configure in Supabase:**
- Enable Google provider
- Add Client ID and Secret
- Set Site URL to production domain

**That's it!** Your Google OAuth should work. 🎉
