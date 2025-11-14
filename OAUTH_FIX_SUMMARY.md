# Google OAuth Fix Summary

## Problem
After successfully authenticating with Google, users were redirected back to the login page instead of staying logged in.

## Root Cause
1. **OAuth callback not being detected**: When returning from Google OAuth, the URL contains hash parameters (`#access_token=...`) but the session wasn't established before redirect logic ran
2. **AuthProvider not wrapping login route**: The `AuthProvider` only wrapped the main app routes, not the `/login` page, so it couldn't handle OAuth callbacks properly
3. **Premature redirects**: The redirect logic in `AuthProvider` and `useSessionCheck` was firing before Supabase could process the OAuth tokens

## Changes Made

### 1. Enhanced OAuth Callback Detection in AuthProvider
**File:** `src/providers/AuthProvider.tsx`

Added logic to detect OAuth callbacks and wait for session establishment:
```typescript
// Don't redirect if we're in the middle of an OAuth callback
const isOAuthCallback = window.location.hash.includes('access_token') || 
                       window.location.hash.includes('error');

if (isOAuthCallback) {
  console.log("[AuthProvider] OAuth callback detected, waiting for session...");
  return; // Let the auth state change handler process the callback
}
```

### 2. Better Logging in Auth State Changes
**File:** `src/providers/AuthProvider.tsx`

Added detailed logging to track OAuth flow:
```typescript
if (_event === 'SIGNED_IN' && newSession) {
  console.log("[AuthProvider] User signed in via OAuth, establishing session...");
}
console.log("[AuthProvider] Profile loaded:", profile ? profile.email : "null");
```

### 3. Wrapped All Routes with AuthProvider
**File:** `src/App.tsx`

Moved `AuthProvider` to wrap all routes including `/login`:
```typescript
// BEFORE:
<Route path="/login" element={<Login />} />
<Route path="/" element={<AuthProvider><AppLayout /></AuthProvider>}>

// AFTER:
<AuthProvider>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<AppLayout />}>
```

This ensures AuthProvider is active when OAuth callback returns to any page.

### 4. Prevented useSessionCheck Interference
**File:** `src/hooks/auth/useSessionCheck.tsx`

Added OAuth callback detection to prevent session check from interfering:
```typescript
// Check if we're in OAuth callback - don't interfere
const isOAuthCallback = window.location.hash.includes('access_token') || 
                       window.location.hash.includes('error');
if (isOAuthCallback) {
  console.log("[useSessionCheck] OAuth callback detected, waiting...");
  setAuthChecked(true);
  return; // Let AuthProvider handle the OAuth callback
}
```

### 5. Improved Google OAuth Hook with Explicit Redirect
**File:** `src/hooks/auth/useGoogleAuth.tsx`

Added comprehensive logging and explicit URL redirect:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}`,
    skipBrowserRedirect: false,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});

if (data?.url) {
  console.log('[useGoogleAuth] Redirecting to Google OAuth URL:', data.url);
  window.location.href = data.url; // Explicit redirect
}
```

### 6. Updated Supabase Client Configuration
**File:** `src/integrations/supabase/client.ts`

Changed to enable session detection and use more secure PKCE flow:
```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,
  storage: localStorage,
  storageKey: 'aafairshare-auth',
  detectSessionInUrl: true,  // Changed from false
  flowType: 'pkce'          // Changed from 'implicit'
}
```

## How It Works Now

### OAuth Flow Steps:

1. **User clicks "Sign in with Google"**
   - `useGoogleAuth` calls `supabase.auth.signInWithOAuth()`
   - Returns OAuth URL from Supabase
   - Browser redirects to Google login

2. **User authenticates with Google**
   - Google redirects to: `https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback`
   - Supabase processes the OAuth response
   - Supabase redirects to: `https://aafairshare.online/#access_token=...&refresh_token=...`

3. **App receives OAuth callback**
   - URL contains hash with tokens: `#access_token=...`
   - `AuthProvider` detects OAuth callback via hash check
   - `AuthProvider` waits, doesn't trigger premature redirects
   - `useSessionCheck` also detects OAuth callback and doesn't interfere

4. **Supabase processes tokens**
   - Supabase client's `detectSessionInUrl: true` reads tokens from hash
   - Auth state change event fires with `SIGNED_IN` event
   - `AuthProvider.onAuthStateChange` handler receives new session

5. **Session established**
   - `AuthProvider` sets session and user state
   - Fetches user profile from database
   - Logs: `[AuthProvider] Profile loaded: user@email.com`

6. **Redirect to dashboard**
   - Redirect logic sees: session exists + on login page
   - Navigates to `/dashboard`
   - User is successfully logged in!

## Console Logs to Expect

When clicking "Sign in with Google":
```
[useGoogleAuth] Starting Google sign-in flow...
[useGoogleAuth] Getting Supabase client...
[useGoogleAuth] Supabase client obtained, initiating OAuth...
[useGoogleAuth] OAuth response: { data: { url: 'https://accounts.google.com/...' }, error: null }
[useGoogleAuth] Redirecting to Google OAuth URL: https://accounts.google.com/...
```

After returning from Google:
```
[useSessionCheck] Checking session on login page...
[useSessionCheck] OAuth callback detected, waiting for AuthProvider to handle it...
[AuthProvider] OAuth callback detected, waiting for session to be established...
[AuthProvider] onAuthStateChange: Event triggered SIGNED_IN Session: exists
[AuthProvider] User signed in via OAuth, establishing session...
[AuthProvider] Profile loaded: user@example.com
[AuthProvider] Session active, on public path, redirecting to /dashboard. Current path: /login
```

## Testing Instructions

### 1. Build the changes:
```bash
cd /Users/antoniosmith/Projects/AAFairShare
npm run build
```

### 2. Test locally:
```bash
npm run dev
```

### 3. Open browser and test:
1. Clear browser cache and cookies for your site
2. Go to: http://localhost:5173/login (or your dev server URL)
3. Open Developer Console (F12)
4. Click "Continue with Google"
5. Sign in with Google
6. Watch console logs
7. Should be redirected to dashboard and logged in

### 4. Deploy and test production:
After deploying to production:
1. Go to: https://aafairshare.online/login
2. Open Developer Console
3. Click "Continue with Google"
4. Sign in
5. Should be redirected to dashboard

## What Should Happen

✅ Click "Continue with Google"
✅ Redirect to Google login page (not seeing Supabase URL in consent)
✅ Enter Google credentials
✅ Briefly see URL with `#access_token=...` (this is normal)
✅ Automatically redirect to dashboard
✅ User is logged in and sees their dashboard
✅ User info visible in app (profile pic, email)

## Troubleshooting

### Still redirecting to /login after OAuth?
**Check:** Console logs - look for OAuth callback detection messages
**Fix:** Make sure hash parameters are in URL after Google redirect

### "Failed to initialize database connection"?
**Check:** Edge function `get-config` is working
**Fix:** Test: `curl https://gsvyxsddmddipeoduyys.supabase.co/functions/v1/get-config`

### Session not persisting after login?
**Check:** localStorage for auth tokens
**Fix:** Clear all site data and try again

### OAuth flow doesn't start?
**Check:** Console for errors from `useGoogleAuth`
**Fix:** Verify Google provider is enabled in Supabase dashboard

## Supabase Configuration Requirements

### Authentication → Providers → Google
- ✅ Enabled: ON
- ✅ Client ID: Set (from Google Console)
- ✅ Client Secret: Set (from Google Console)

### Authentication → URL Configuration
- ✅ Site URL: `https://aafairshare.online` (no trailing slash)
- ✅ Redirect URLs: `https://aafairshare.online/**`

### Google Console → OAuth 2.0 Client ID
- ✅ Authorized redirect URIs: `https://gsvyxsddmddipeoduyys.supabase.co/auth/v1/callback`
- ✅ Authorized JavaScript origins: `https://aafairshare.online`

## Additional Fix: 401 Unauthorized Error

### Problem
After the initial fixes, a 401 Unauthorized error occurred when Supabase tried to fetch user data during OAuth callback.

### Cause
The Supabase client was being initialized lazily, but there was a placeholder client with an invalid API key that was created synchronously. When the OAuth callback happened, Supabase's auth library tried to automatically process the callback using this placeholder client, resulting in 401 errors.

### Solution
Changed from lazy initialization to **eager initialization**:
- Initialize the Supabase client immediately when the module loads
- Fetch the real API key from the edge function before OAuth can be triggered
- Remove the placeholder client that was causing 401 errors

**File:** `src/integrations/supabase/client.ts`

```typescript
// BEFORE: Lazy initialization
let supabaseClientPromise: Promise<...> | null = null;
export const getSupabase = async () => {
  if (!supabaseClientPromise) {
    supabaseClientPromise = createSupabaseClient();
  }
  return supabaseClientPromise;
};

// Placeholder with invalid key
export const supabase = createClient(URL, "placeholder-key-will-be-replaced", {...});

// AFTER: Eager initialization
console.log("[SupabaseClient] Starting client initialization...");
let supabaseClientPromise: Promise<...> = createSupabaseClient(); // Initialize immediately
let supabaseClientInstance = null;

supabaseClientPromise.then(client => {
  supabaseClientInstance = client;
  console.log("[SupabaseClient] Client instance ready");
});

export const getSupabase = async () => {
  return supabaseClientPromise;
};

// Proxy that uses the real client once initialized
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    if (!supabaseClientInstance) {
      throw new Error('Supabase client not initialized yet. Use await getSupabase() instead.');
    }
    return supabaseClientInstance[prop];
  }
});
```

This ensures:
1. Real API key is loaded before OAuth can happen
2. No placeholder client to cause 401 errors
3. Supabase auth can properly process OAuth callbacks

## Files Modified

1. `src/providers/AuthProvider.tsx` - OAuth callback detection, better logging
2. `src/hooks/auth/useSessionCheck.tsx` - Prevent interference with OAuth
3. `src/hooks/auth/useGoogleAuth.tsx` - Enhanced logging, explicit redirect
4. `src/integrations/supabase/client.ts` - Enable session detection, use PKCE, eager initialization
5. `src/App.tsx` - Wrap all routes with AuthProvider

## Commit Message Suggestion

```
fix: Resolve Google OAuth redirect loop to login page

- Wrap AuthProvider around all routes including /login to handle OAuth callbacks
- Add OAuth callback detection to prevent premature redirects
- Enable detectSessionInUrl and switch to PKCE flow for better security
- Add comprehensive logging to track OAuth flow
- Prevent useSessionCheck from interfering with OAuth callback processing

Fixes issue where users were redirected back to login page after successfully
authenticating with Google. The AuthProvider now properly detects and waits for
OAuth callback to complete before running redirect logic.

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

## Next Steps

1. ✅ Code changes completed
2. ⏳ Build and test locally
3. ⏳ Test in production environment
4. ⏳ Verify session persists across page refreshes
5. ⏳ Verify logout and re-login works correctly
