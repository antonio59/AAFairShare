## Prerequisites
- SSH access to Hetzner server at `46.62.151.85` (user with sudo, e.g., `root`).
- Confirm DNS: `pb.aafairshare.online` A record points to `46.62.151.85`.
- Choose reverse proxy: default to Caddy (automatic HTTPS). Nginx + Certbot is also fine.

## Verify DNS
- Check resolution from a workstation: `dig pb.aafairshare.online +short` → should return `46.62.151.85`.

## Install PocketBase (server)
- Create directories: `mkdir -p /usr/local/bin /var/lib/pocketbase`
- Download binary: `curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_amd64.zip -o /tmp/pb.zip`
- Unzip & install:
  - `apt-get update && apt-get install -y unzip`
  - `unzip /tmp/pb.zip -d /tmp/pb && mv /tmp/pb/pocketbase /usr/local/bin/pocketbase && chmod +x /usr/local/bin/pocketbase`
- (Optional) create service user: `useradd -r -s /usr/sbin/nologin pocketbase && chown -R pocketbase:pocketbase /var/lib/pocketbase`

## Systemd Service
- Unit file `/etc/systemd/system/pocketbase.service`:
```
[Unit]
Description=PocketBase
After=network.target

[Service]
User=pocketbase
Group=pocketbase
ExecStart=/usr/local/bin/pocketbase serve --http 127.0.0.1:8090 --dir /var/lib/pocketbase
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```
- Enable & start: `systemctl daemon-reload && systemctl enable pocketbase && systemctl start pocketbase`
- Health check (local): `curl -s http://127.0.0.1:8090/api/health`

## Reverse Proxy & TLS (Caddy recommended)
- Install Caddy: `apt-get install -y debian-keyring debian-archive-keyring apt-transport-https && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && apt-get update && apt-get install -y caddy`
- Caddyfile `/etc/caddy/Caddyfile`:
```
pb.aafairshare.online {
  encode gzip
  reverse_proxy 127.0.0.1:8090
}
```
- Restart Caddy: `systemctl restart caddy`
- Verify HTTPS: open `https://pb.aafairshare.online/api/health`

## (Alternative) Nginx + Certbot
- Install: `apt-get install -y nginx certbot python3-certbot-nginx`
- Server block `/etc/nginx/sites-available/pb.aafairshare.online`:
```
server {
  server_name pb.aafairshare.online;
  location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
- Enable site: `ln -s /etc/nginx/sites-available/pb.aafairshare.online /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx`
- TLS: `certbot --nginx -d pb.aafairshare.online`

## Firewall
- Allow web: `ufw allow 80/tcp && ufw allow 443/tcp`
- Keep `8090` local-only (no inbound rule).

## Admin & Auth Setup
- Open Admin UI: `https://pb.aafairshare.online/_/`
- Create admin account (first-run) or sign in.
- Settings → Auth:
  - Enable Email/Password.
  - Add allowed origins: your app domain(s) and `http://localhost:8080` for development.
  - (Optional) SMTP settings for email features.

## Collections & Fields
- Create the following collections (relations as noted):
- `categories`: `name` (text), `icon` (text, optional), `color` (text, optional)
- `locations`: `name` (text)
- `expenses`: `amount` (number), `date` (date), `month` (text), `description` (text), `paid_by_id` (relation → `users`), `category_id` (relation → `categories`), `location_id` (relation → `locations`), `split_type` (enum: 50/50, custom, 100%)
- `recurring`: `amount` (number), `next_due_date` (date), `end_date` (date, optional), `frequency` (text), `description` (text), `user_id` (relation → `users`), `category_id` (relation → `categories`), `location_id` (relation → `locations`), `split_type` (enum)
- `settlements`: `month` (text), `date` (date), `amount` (number), `from_user_id` (relation → `users`), `to_user_id` (relation → `users`), `status` (text), `recorded_by` (relation → `users`)
- `shopping_lists`: `name` (text), `type` (enum: grocery, holidays, car, other), `createdBy` (relation → `users`)
- `shopping_items`: `listId` (relation → `shopping_lists`), `name` (text), `cost` (number), `split` (enum: 50/50, custom, 100%), `purchased` (bool), `notes` (text, optional)
- Start with permissive rules for testing (authenticated read/write), tighten later.

## App Configuration
- In your app `.env`: `VITE_POCKETBASE_URL=https://pb.aafairshare.online`
- Restart dev server. Verify health and log in.

## Validation Checklist
- `https://pb.aafairshare.online/api/health` returns 200.
- Admin UI reachable at `https://pb.aafairshare.online/_/`.
- Two test users can be created and sign in via `/login`.
- Dashboard, Recurring, Settlement, Analytics, Lists all fetch data from PocketBase.

## Optional Enhancements
- SMTP for email features (settlement emails).
- Backups: periodic `tar` of `/var/lib/pocketbase` or snapshot-based backup.
- Monitoring: systemd logs (`journalctl -u pocketbase`), reverse proxy access logs.

## If You Approve
- I will: SSH to the Hetzner server, install PocketBase, configure the service, set up Caddy with HTTPS for `pb.aafairshare.online`, and perform a full end-to-end validation including admin access, collection creation, and app connectivity.