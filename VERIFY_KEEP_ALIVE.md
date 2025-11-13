# How to Verify Keep-Alive is Working

## Quick Verification Methods

### Method 1: Check GitHub Actions (Easiest)

1. **Go to GitHub Actions**: https://github.com/antonio59/AAFairShare/actions

2. **Look for "Supabase Keep Alive" workflow**

3. **Check recent runs**:
   - ✅ **Green checkmarks** = Working perfectly
   - ⚠️ **Yellow circles** = Currently running
   - ❌ **Red X's** = Failed (needs attention)

4. **Click on a recent run** to see details:
   ```
   ✅ REST API ping successful (HTTP 200)
   ✅ Heartbeat function ping successful (HTTP 200)
   ✅ Supabase database kept alive
   ```

**What you should see:**
- Runs every 6 hours (4 times per day)
- All steps passing with green checkmarks
- Recent run within last 6 hours

---

### Method 2: Manually Trigger Test Run

1. **Go to**: https://github.com/antonio59/AAFairShare/actions/workflows/supabase-keep-alive.yml

2. **Click**: "Run workflow" button (top right)

3. **Select**: Branch: `main`

4. **Click**: "Run workflow"

5. **Wait 30-60 seconds**

6. **Refresh the page** - you should see:
   - New run appears
   - Shows as running (yellow circle)
   - After ~30 seconds, shows green checkmark ✅

7. **Click on the run** to see detailed logs

**Expected output:**
```
✅ REST API ping successful (HTTP 200)
✅ Heartbeat function ping successful (HTTP 200)
✅ Supabase database kept alive
✅ get-config function also warmed up (HTTP 200)
```

---

### Method 3: Check Workflow Schedule

View when the workflow last ran and when it will run next:

1. **Go to**: https://github.com/antonio59/AAFairShare/actions/workflows/supabase-keep-alive.yml

2. **Look at recent runs** - should show runs at:
   - 00:00 UTC (midnight)
   - 06:00 UTC (6am)
   - 12:00 UTC (noon)
   - 18:00 UTC (6pm)

**Convert to your timezone:**
- If you're EST (UTC-5): 7pm, 1am, 7am, 1pm
- If you're PST (UTC-8): 4pm, 10pm, 4am, 10am
- If you're GMT (UTC+0): midnight, 6am, noon, 6pm

---

### Method 4: Test Heartbeat Function Manually

Test the heartbeat function directly:

```bash
# Using your Supabase anon key
curl "https://gsvyxsddmddipeoduyys.supabase.co/functions/v1/heartbeat" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected response:**
```json
{
  "success": true,
  "data": [...]
}
```

**If it works:** Your keep-alive function is deployed and working! ✅

---

### Method 5: Check Supabase Project Status

1. **Go to Supabase Dashboard**: https://app.supabase.com/project/gsvyxsddmddipeoduyys

2. **Look for pause warnings**:
   - If you see: "Project will pause after X days of inactivity" ⚠️
   - With keep-alive: You should NOT see this message ✅

3. **Check Project Settings** → **General**:
   - Look for "Last Activity" timestamp
   - Should update every 6 hours when keep-alive runs

---

## What Success Looks Like

### ✅ Healthy Keep-Alive

**In GitHub Actions:**
- Green checkmarks on all recent runs
- Runs every 6 hours consistently
- No failed runs in last 7 days
- Latest run shows:
  ```
  ✅ REST API ping successful
  ✅ Heartbeat function ping successful
  ✅ Supabase database kept alive
  ```

**In Supabase Dashboard:**
- No pause warnings
- Project shows active status
- Database accessible without delays

---

## What Problems Look Like

### ❌ Not Working

**In GitHub Actions:**
- ❌ Red X's on recent runs
- No runs in last 6+ hours
- Error messages like:
  ```
  ⚠️ Supabase URL or Anon Key is not set
  ❌ Heartbeat function returned HTTP 404
  ❌ Heartbeat function returned HTTP 500
  ```

**In Supabase Dashboard:**
- ⚠️ Warning: "Project will pause in X days"
- Project shows as "Paused" or "Inactive"

---

## Troubleshooting Failed Runs

### Issue: "Supabase URL or Anon Key is not set"

**Fix**: Add GitHub secrets

1. Go to: https://github.com/antonio59/AAFairShare/settings/secrets/actions
2. Add secrets:
   - `VITE_SUPABASE_URL` = `https://gsvyxsddmddipeoduyys.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (your key from Supabase)

### Issue: "Heartbeat function returned HTTP 404"

**Fix**: Deploy the function

```bash
cd /Users/antoniosmith/Projects/AAFairShare
npx supabase functions deploy heartbeat
```

### Issue: "Heartbeat function returned HTTP 500"

**Possible causes:**
1. No data in `expenses` table (function queries this)
2. Database permissions issue

**Fix**: Check function logs in Supabase Dashboard

---

## Monitoring Commands

### Check from Command Line

```bash
# Check latest workflow runs
curl -s "https://api.github.com/repos/antonio59/AAFairShare/actions/workflows/supabase-keep-alive.yml/runs?per_page=5" | grep -E '"status"|"conclusion"|"created_at"'

# Test heartbeat function
curl "https://gsvyxsddmddipeoduyys.supabase.co/functions/v1/heartbeat" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Set Up Notifications

**GitHub Email Notifications:**

1. Go to: https://github.com/settings/notifications
2. Under "Actions":
   - ✅ Enable "Send notifications for failed workflows"
   - You'll get email if keep-alive fails

**Status Badge (Optional):**

Add to your README to see status at a glance:

```markdown
![Keep Alive](https://github.com/antonio59/AAFairShare/actions/workflows/supabase-keep-alive.yml/badge.svg)
```

Shows: ![Keep Alive](https://img.shields.io/badge/keep--alive-passing-brightgreen)

---

## Expected Behavior Timeline

### Day 1 (Today)
- ✅ Function deployed
- ✅ GitHub secrets added
- ✅ Manual test run successful
- ✅ Waiting for first scheduled run

### Day 2-7 (This Week)
- ✅ 4 successful runs per day (every 6 hours)
- ✅ All showing green checkmarks
- ✅ No pause warnings in Supabase

### Week 2+ (Long Term)
- ✅ Continuous successful runs
- ✅ Supabase never paused
- ✅ No "inactivity" warnings
- ✅ Database always accessible

---

## Quick Verification Checklist

Run through this list right now:

- [ ] Go to GitHub Actions page
- [ ] See "Supabase Keep Alive" workflow
- [ ] Click on workflow
- [ ] See recent runs (or manually trigger one)
- [ ] Latest run shows green checkmark ✅
- [ ] Click into run details
- [ ] All 3-4 steps show green checkmarks
- [ ] Logs show "Supabase database kept alive"
- [ ] Go to Supabase dashboard
- [ ] No pause warnings visible
- [ ] Project shows active status

**If all checked:** Your keep-alive is working! 🎉

---

## What to Do if It Fails

1. **Check GitHub secrets** are set correctly
2. **Verify heartbeat function is deployed**: `npx supabase functions deploy heartbeat`
3. **Look at error logs** in failed workflow run
4. **Test heartbeat manually** with curl command
5. **Check Supabase function logs** in Dashboard

---

## Summary

**Easiest way to verify:**
1. Go to: https://github.com/antonio59/AAFairShare/actions
2. Look for green checkmarks on "Supabase Keep Alive"
3. If green = working ✅
4. If red = needs fixing ❌

**That's it!** As long as you see green checkmarks every 6 hours, your Supabase will never pause. 🚀
