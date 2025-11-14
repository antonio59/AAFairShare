# Fix Google OAuth - Action Items

## Code Changes Made ✅
1. Changed `detectSessionInUrl` from `false` to `true` in Supabase client
2. Changed `flowType` from `implicit` to `pkce` (more secure)
3. Cleaned up `redirectTo` URL format

## Supabase Dashboard Configuration (YOU MUST DO THIS)

### 1. Check Site URL Settings
Go to: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/url-configuration

**Site URL should be:**
```
https://aafairshare.online
```
(NOT localhost, NOT with trailing slash)

**Redirect URLs should include:**
```
https://aafairshare.online/**
http://localhost:5173/**
http://localhost:8080/**
```

### 2. Verify Google Provider Settings
Go to: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/providers

Click on **Google** provider and verify:

- ✅ **Enabled**: Must be ON
- ✅ **Client ID**: From Google Console (ends with .apps.googleusercontent.com)
- ✅ **Client Secret**: From Google Console
- ✅ **Authorized Client IDs**: Leave empty (unless you have specific needs)
- ✅ **Skip nonce check**: Should be OFF (more secure)

### 3. Verify Google Console Configuration
Go to: https://console.cloud.google.com/apis/credentials

Find your OAuth 2.0 Client ID and verify:

**Authorized redirect URIs MUST include:**
```
https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
```

**Authorized JavaScript origins should include:**
```
https://aafairshare.online
https://gsvyxsddmddipeoduyys.supabase.co
```

### 4. Test the Flow

After making the Supabase config changes:

1. **Clear your browser cache and cookies** for your site
2. Go to: https://aafairshare.online
3. Click "Sign in with Google"
4. You should be redirected to Google (NOT see Supabase URL in consent screen)
5. After signing in with Google, you should be redirected back to your app

## What Changed and Why

### Problem 1: Session Detection
**Before:** `detectSessionInUrl: false`
- App couldn't read the auth tokens from URL after OAuth redirect
- Caused login to fail silently

**After:** `detectSessionInUrl: true`
- App now reads tokens from URL after Supabase redirects back
- Essential for OAuth flow to work

### Problem 2: Flow Type
**Before:** `flowType: 'implicit'`
- Less secure, tokens in URL
- Being deprecated

**After:** `flowType: 'pkce'`
- More secure flow
- Industry standard for OAuth
- Better protection against interception attacks

### Problem 3: Redirect URL
**Before:** Used template literal with trailing slash
**After:** Simple origin without trailing slash
- Cleaner, more standard format
- Matches Supabase expectations

## Expected OAuth Flow (After Fix)

```
User clicks "Sign in with Google"
    ↓
Redirect to: accounts.google.com (Google login page)
    ↓
User logs in and consents
    ↓
Google redirects to: gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
    (User SHOULD NOT see this - happens automatically)
    ↓
Supabase processes auth and redirects to: aafairshare.online
    (with auth tokens in URL hash)
    ↓
Your app detects tokens (detectSessionInUrl: true)
    ↓
User is logged in ✅
```

## Troubleshooting

### Still seeing Supabase URL in consent screen?
**Check:** Google Console → OAuth consent screen → Authorized domains
- Add: `supabase.co`
- Add: `aafairshare.online`

### "localhost refused to connect" error?
**Cause:** Site URL in Supabase is set to localhost
**Fix:** Change Site URL to `https://aafairshare.online`

### "redirect_uri_mismatch" error?
**Cause:** Missing redirect URI in Google Console
**Fix:** Add `https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback`

### Login completes but user not logged in?
**Cause:** Session not being detected
**Fix:** Already fixed by changing `detectSessionInUrl: true`

## Next Steps

1. ✅ Code changes are done (already committed above)
2. ⏳ Go to Supabase dashboard and verify/update configuration
3. ⏳ Go to Google Console and verify redirect URIs
4. ⏳ Test the login flow
5. ⏳ Verify user is properly logged in and redirected

## Quick Verification Commands

After deploying, test with:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Then open the URL and test Google login.
