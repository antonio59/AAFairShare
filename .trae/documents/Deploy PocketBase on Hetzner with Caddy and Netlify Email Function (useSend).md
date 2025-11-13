## Server Setup (Hetzner 46.62.151.85)
- SSH to server (sudo-capable user).
- Create data dir: `sudo mkdir -p /var/lib/pocketbase && sudo chown -R root:root /var/lib/pocketbase`
- Install unzip: `sudo apt-get update && sudo apt-get install -y unzip`
- Download PocketBase: `curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_amd64.zip -o /tmp/pb.zip`
- Unzip & install: `unzip /tmp/pb.zip -d /tmp/pb && sudo mv /tmp/pb/pocketbase /usr/local/bin/pocketbase && sudo chmod +x /usr/local/bin/pocketbase`

## Systemd Service
- Create `/etc/systemd/system/pocketbase.service`:
```
[Unit]
Description=PocketBase
After=network.target

[Service]
ExecStart=/usr/local/bin/pocketbase serve --http 127.0.0.1:8090 --dir /var/lib/pocketbase
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```
- Enable & start: `sudo systemctl daemon-reload && sudo systemctl enable pocketbase && sudo systemctl start pocketbase`
- Health: `curl -s http://127.0.0.1:8090/api/health`

## Caddy (TLS + Reverse Proxy)
- Install Caddy:
```
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```
- `/etc/caddy/Caddyfile`:
```
pb.aafairshare.online {
  encode gzip
  reverse_proxy 127.0.0.1:8090
}
```
- Restart: `sudo systemctl restart caddy`
- Verify: open `https://pb.aafairshare.online/api/health`

## Firewall
- Allow web: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`
- Keep `8090` local-only.

## PocketBase Admin & Auth
- Access Admin: `https://pb.aafairshare.online/_/`
- Create admin account or sign in.
- Settings → Auth:
  - Enable Email/Password.
  - Allowed origins: your Netlify site domain and `http://localhost:8080`.

## Collections
- Create:
  - `categories`: `name`, `icon?`, `color?`
  - `locations`: `name`
  - `expenses`: `amount`, `date`, `month`, `description`, `paid_by_id` (relation → `users`), `category_id` (relation), `location_id` (relation), `split_type` (enum: 50/50, custom, 100%)
  - `recurring`: `amount`, `next_due_date`, `end_date?`, `frequency`, `description`, `user_id` (relation → `users`), `category_id`, `location_id`, `split_type`
  - `settlements`: `month`, `date`, `amount`, `from_user_id` (relation), `to_user_id` (relation), `status`, `recorded_by` (relation)
  - `shopping_lists`: `name`, `type` (enum grocery/holidays/car/other), `createdBy` (relation → `users`)
  - `shopping_items`: `listId` (relation → `shopping_lists`), `name`, `cost`, `split` (enum), `purchased` (bool), `notes?`
- Start with permissive rules for testing (authenticated read/write), then tighten.

## Netlify Function (useSend)
- In repo: create `netlify/functions/send-settlement-email.ts`.
- Add env in Netlify site settings:
  - `USESEND_API_KEY` (from useSend)
  - `EMAIL_FROM` (your from address)
- Function responsibilities:
  - Accept POST JSON with settlement data and recipient emails.
  - Generate CSV from expenses; generate PDF via a Node PDF lib (e.g., `pdfkit`).
  - Call useSend API/SDK to send email with attachments.
- Netlify config:
  - Ensure `netlify.toml` includes functions directory or add it: 
```
[build]
  publish = "dist"
  functions = "netlify/functions"
```
- Client integration:
  - Replace current email invocation with a fetch to `/.netlify/functions/send-settlement-email` sending JSON payload.

## App Env (Netlify)
- Set `VITE_POCKETBASE_URL=https://pb.aafairshare.online` in Netlify environment variables for the `aafairshare` project.
- Keep existing Netlify CI/CD; builds proceed as before.

## Validation
- PocketBase health returns 200.
- Admin UI reachable.
- Create two users and log into the app.
- Verify Dashboard/Recurring/Settlement/Analytics/Lists.
- Send a test settlement email via the Netlify function; confirm delivery.

## If You Approve
- I will perform the server setup on Hetzner (PocketBase + Caddy), configure the Netlify function with useSend, set Netlify env vars and run end-to-end validation.