## Screenshot Runbook (temporary)

Prereqs (one-time):
- Install browsers: `bunx playwright install chromium`
- Set demo mode: in `.env`, `VITE_GUEST_MODE=true` (optional: `VITE_DEMO_USER_NAME`, `VITE_DEMO_USER_EMAIL`, `VITE_DEMO_USER_AVATAR`, and partner equivalents)

Mobile captures (iPhone 13 viewport, saves to `artifacts/screenshots`):
```bash
cd /Users/antoniosmith/Projects/AAFairShare
VITE_GUEST_MODE=true bun run dev -- --host --port 5002 >/tmp/aaf_dev.log 2>&1 & pid=$!
sleep 4
BASE_URL=http://localhost:5002 OUT_DIR=./artifacts/screenshots bun run capture
kill $pid
```

Desktop captures (1440x900 viewport, saves to `artifacts/screenshots-desktop`):
```bash
cd /Users/antoniosmith/Projects/AAFairShare
VITE_GUEST_MODE=true bun run dev -- --host --port 5002 >/tmp/aaf_dev.log 2>&1 & pid=$!
sleep 4
VIEWPORT=desktop BASE_URL=http://localhost:5002 OUT_DIR=./artifacts/screenshots-desktop bun run capture
kill $pid
```

Publishing to landing slider:
- Copy desired PNGs into `public/screens/` (desktop or mobile set) to show in the product tour.
