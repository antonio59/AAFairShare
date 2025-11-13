# Supabase Keep-Alive Setup

## Purpose
Prevent Supabase free tier from pausing due to inactivity by automatically pinging your database every 6 hours.

---

## Current Status

✅ **Workflow exists**: `.github/workflows/supabase-keep-alive.yml`  
✅ **Heartbeat function exists**: `supabase/functions/heartbeat/index.ts`  
❌ **GitHub Secrets needed**: Must be configured in repository

---

## Setup Steps

### 1. Get Your Supabase Credentials

1. **Go to your Supabase project**: https://app.supabase.com/project/gsvyxsddmddipeoduyys

2. **Navigate to**: Settings → API

3. **Copy these values**:
   - **Project URL**: `https://gsvyxsddmddipeoduyys.supabase.co`
   - **anon/public key**: (starts with `eyJ...`)
   - **service_role key**: (starts with `eyJ...`) ← Use this for keep-alive

---

### 2. Add GitHub Secrets

1. **Go to your GitHub repository**: https://github.com/antonio59/AAFairShare

2. **Navigate to**: Settings → Secrets and variables → Actions

3. **Click**: "New repository secret"

4. **Add these secrets**:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://gsvyxsddmddipeoduyys.supabase.co`

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (your anon key from Supabase)

---

### 3. Verify Heartbeat Function is Deployed

The heartbeat function needs to be deployed to Supabase:

```bash
cd /Users/antoniosmith/Projects/AAFairShare

# Login to Supabase CLI (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref gsvyxsddmddipeoduyys

# Deploy the heartbeat function
npx supabase functions deploy heartbeat

# Test it
curl "https://gsvyxsddmddipeoduyys.supabase.co/functions/v1/heartbeat" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 4. Test the GitHub Workflow

#### Option A: Manual Test (Easiest)

1. **Go to**: https://github.com/antonio59/AAFairShare/actions

2. **Click**: "Supabase Keep Alive" workflow

3. **Click**: "Run workflow" button

4. **Select**: main branch

5. **Click**: "Run workflow"

6. **Wait 1-2 minutes** and check if it succeeds

#### Option B: Wait for Scheduled Run

The workflow runs automatically every 6 hours (at 00:00, 06:00, 12:00, 18:00 UTC).

---

## How It Works

### The Workflow Does 3 Things:

1. **Pings Supabase REST API**
   - Basic health check
   - Wakes up the database

2. **Calls Heartbeat Edge Function**
   - Queries your `expenses` table
   - Ensures database stays active
   - **Most important for preventing pause**

3. **Calls get-config Function** (optional)
   - Additional warmup
   - Not critical if it fails

---

## Troubleshooting

### Issue: Workflow fails with "Supabase URL or Anon Key is not set"

**Fix**: Add the GitHub secrets (see Step 2 above)

### Issue: Heartbeat function returns 404

**Cause**: Function not deployed  
**Fix**:
```bash
npx supabase functions deploy heartbeat
```

### Issue: Heartbeat function returns 500

**Possible causes:**
1. **No expenses in database** - Function queries expenses table
2. **Database permissions** - Service role key needed

**Fix**: Make sure you have at least one expense in your database, or modify the function to query a different table.

### Issue: REST API ping works but heartbeat fails

**Cause**: Edge function not deployed or misconfigured  
**Fix**: Deploy the function (see Step 3)

---

## Verify It's Working

### Check GitHub Actions

1. **Go to**: https://github.com/antonio59/AAFairShare/actions

2. **Look for**: "Supabase Keep Alive" runs

3. **Should see**: ✅ Green checkmarks every 6 hours

### Check Workflow Run Details

Click on a workflow run to see:
```
✅ REST API ping successful (HTTP 200)
✅ Heartbeat function ping successful (HTTP 200)
✅ Supabase database kept alive
```

---

## Customization

### Change Frequency

Edit `.github/workflows/supabase-keep-alive.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours (current)
  - cron: '0 */4 * * *'  # Every 4 hours (more frequent)
  - cron: '0 */12 * * *' # Every 12 hours (less frequent)
```

**Recommendation**: Keep at 6 hours - good balance between activity and API limits.

### Add More Endpoints

Add more pings to ensure all parts of your app stay warm:

```yaml
- name: Ping Additional Function
  run: |
    curl "${SUPABASE_URL}/functions/v1/your-function" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## Alternative: Netlify Scheduled Functions

If you prefer Netlify to handle keep-alive:

### Create Netlify Function

File: `netlify/functions/keep-alive.ts`

```typescript
import { schedule } from "@netlify/functions"

export const handler = schedule("0 */6 * * *", async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  try {
    // Ping heartbeat function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/heartbeat`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (response.ok) {
      console.log("✅ Supabase kept alive")
      return { statusCode: 200, body: "Success" }
    } else {
      console.error("❌ Heartbeat failed:", response.status)
      return { statusCode: 500, body: "Failed" }
    }
  } catch (error) {
    console.error("❌ Error:", error)
    return { statusCode: 500, body: "Error" }
  }
})
```

**Note**: Netlify scheduled functions require paid plan.

---

## Monitoring

### Set Up Notifications

1. **GitHub Email Notifications**:
   - Settings → Notifications → Actions
   - Enable "Send notifications for failed workflows only"

2. **GitHub Status Badge** (Optional):
   Add to README.md:
   ```markdown
   ![Supabase Keep Alive](https://github.com/antonio59/AAFairShare/actions/workflows/supabase-keep-alive.yml/badge.svg)
   ```

---

## Summary

✅ **Workflow**: Runs every 6 hours automatically  
✅ **Heartbeat Function**: Queries database to keep it active  
✅ **GitHub Secrets**: Store Supabase credentials securely  
✅ **Zero Cost**: Free on GitHub Actions  
✅ **Low Maintenance**: Set it and forget it

---

## Quick Checklist

Before your keep-alive works:

- [ ] GitHub secrets added (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Heartbeat function deployed to Supabase
- [ ] Workflow tested manually (green checkmark)
- [ ] Verified in Actions tab that it runs successfully
- [ ] Set up failure notifications (optional)

---

## Next Steps

1. **Add GitHub secrets** (Step 2)
2. **Deploy heartbeat function** (Step 3)
3. **Test workflow manually** (Step 4)
4. **Verify it runs every 6 hours**
5. **Your Supabase will never pause!** 🎉

---

## Need Help?

- **Check workflow logs**: GitHub Actions tab → Click on failed run
- **Test heartbeat manually**: Use curl command in Step 3
- **Verify secrets**: GitHub Settings → Secrets and variables → Actions
