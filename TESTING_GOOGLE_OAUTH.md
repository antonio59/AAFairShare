# Testing Google OAuth - Debugging Steps

## Changes Made

1. ✅ Added comprehensive logging to track OAuth flow
2. ✅ Explicitly capture and use the OAuth redirect URL
3. ✅ Better error handling with specific messages
4. ✅ Force redirect to OAuth URL if auto-redirect fails

## What to Do Next

### Step 1: Build and Deploy
```bash
cd /Users/antoniosmith/Projects/AAFairShare
npm run build
```

### Step 2: Test Locally First
```bash
npm run dev
```

Then open: http://localhost:5173 (or whatever port Vite uses)

### Step 3: Open Browser Developer Console

**Before clicking "Sign in with Google":**
1. Press **F12** or right-click → **Inspect**
2. Click on **Console** tab
3. Clear any existing logs (trash icon)

### Step 4: Click "Sign in with Google"

You should see console logs like this:

#### ✅ **SUCCESS PATTERN:**
```
[useGoogleAuth] Starting Google sign-in flow...
[useGoogleAuth] Getting Supabase client...
[SupabaseClient] Fetching Supabase configuration from edge function...
[SupabaseClient] Config loaded successfully: {...}
[SupabaseClient] Creating Supabase client with URL: https://gsvyxsddmddipeoduyys.supabase.co
[useGoogleAuth] Supabase client obtained, initiating OAuth...
[useGoogleAuth] OAuth response: { data: { url: 'https://accounts.google.com/...' }, error: null }
[useGoogleAuth] Redirecting to Google OAuth URL: https://accounts.google.com/...
```
Then the page should redirect to Google.

#### ❌ **ERROR PATTERNS TO LOOK FOR:**

**Pattern 1: No redirect URL**
```
[useGoogleAuth] OAuth response: { data: { url: null }, error: null }
[useGoogleAuth] No redirect URL returned from OAuth
```
**Cause:** Google provider not properly configured in Supabase
**Fix:** Check Supabase dashboard → Authentication → Providers → Google

**Pattern 2: OAuth error**
```
[useGoogleAuth] OAuth error: { message: "..." }
```
**Cause:** Configuration issue (Client ID/Secret wrong, or redirect URI mismatch)
**Fix:** Verify Google Console credentials match Supabase settings

**Pattern 3: Supabase client initialization fails**
```
[SupabaseClient] Config fetch error - Status: 403
```
**Cause:** Edge function `get-config` not accessible or API key issue
**Fix:** Check Supabase edge function is deployed and working

**Pattern 4: No logs at all**
**Cause:** JavaScript error preventing code execution
**Fix:** Check Console for any red error messages

### Step 5: What to Report Back

After clicking "Sign in with Google", tell me:

1. **What logs appeared in the console?** (copy-paste them)
2. **What happened on screen?** (page refresh? error message? nothing?)
3. **Any red error messages in console?**

This will tell us exactly where the flow is breaking.

## Common Issues and Quick Fixes

### Issue: "Failed to get configuration" error

**Problem:** Edge function not responding

**Quick check:**
```bash
# Test the edge function directly
curl https://gsvyxsddmddipeoduyys.supabase.co/functions/v1/get-config
```

**Expected response:**
```json
{
  "supabaseUrl": "https://gsvyxsddmddipeoduyys.supabase.co",
  "supabaseAnonKey": "eyJ..."
}
```

### Issue: Page just refreshes with no logs

**Possible causes:**
1. Browser blocking the OAuth redirect (check for pop-up blocker)
2. JavaScript error preventing code execution
3. Supabase client initialization timing out

**What to check:**
- Console tab for any errors
- Network tab for failed requests (filter by "supabase" or "google")
- Try in incognito/private mode

### Issue: Seeing Supabase URL in Google consent screen

**This is actually okay!** The flow is:
1. Your app → Supabase OAuth URL
2. Supabase → Google login
3. Google → Supabase callback
4. Supabase → Your app (with auth tokens)

You **should not** see the Supabase URL in a visible browser window though - it should redirect automatically.

## Network Tab Debugging

If console logs don't help, check the **Network** tab:

1. Open DevTools → **Network** tab
2. Click "Sign in with Google"
3. Look for:
   - Request to `/functions/v1/get-config` - should return 200
   - Request to Supabase auth endpoint - should return OAuth URL
   - Redirect to `accounts.google.com` - means OAuth initiated

## After Successful Login

If you successfully log in with Google, you should:
1. Be redirected back to your app (aafairshare.online)
2. See the dashboard (not login page)
3. See your Google profile info

The URL might briefly show hash parameters like:
```
https://aafairshare.online/#access_token=...&refresh_token=...
```
This is normal - the app will parse these and store the session.

## Supabase Configuration Double-Check

Go to: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/providers

Click **Google** and verify:
- ✅ **Enabled:** ON
- ✅ **Client ID:** Set (ends with .apps.googleusercontent.com)
- ✅ **Client Secret:** Set
- ✅ **Authorized redirect URI** shown as:
  ```
  https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
  ```

Then go to: https://app.supabase.com/project/gsvyxsddmddipeoduyys/auth/url-configuration

Verify:
- ✅ **Site URL:** `https://aafairshare.online` (no trailing slash!)
- ✅ **Redirect URLs:** Should include `https://aafairshare.online/**`

## Google Console Double-Check

Go to: https://console.cloud.google.com/apis/credentials

Find your OAuth 2.0 Client ID, click Edit, and verify:

**Authorized redirect URIs** includes:
```
https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback
```

**Authorized JavaScript origins** includes:
```
https://aafairshare.online
```

## Next Steps Based on Results

### If you get console logs:
→ Share them with me and I'll diagnose the exact issue

### If you get no console logs:
→ There's a JavaScript error preventing execution
→ Check for red error messages in console

### If OAuth succeeds but login fails:
→ Issue is with session detection or redirect handling
→ Check Network tab for auth token in redirect URL

### If you see Supabase URL in browser:
→ Auto-redirect is failing
→ May need to adjust browser settings or test in different browser
