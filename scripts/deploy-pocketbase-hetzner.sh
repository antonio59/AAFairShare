#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-pb.aafairshare.online}"
PB_BIN="/usr/local/bin/pocketbase"
PB_DIR="/var/lib/pocketbase"
SERVICE="/etc/systemd/system/pocketbase.service"
CADDYFILE="/etc/caddy/Caddyfile"
TMP_DIR="$(mktemp -d)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y unzip curl ca-certificates debian-keyring debian-archive-keyring apt-transport-https

mkdir -p "$PB_DIR"
curl -L "https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_amd64.zip" -o "$TMP_DIR/pb.zip"
unzip "$TMP_DIR/pb.zip" -d "$TMP_DIR"
mv "$TMP_DIR/pocketbase" "$PB_BIN"
chmod +x "$PB_BIN"

cat > "$SERVICE" << 'EOF'
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
EOF

systemctl daemon-reload
systemctl enable pocketbase
systemctl restart pocketbase

curl -fsS http://127.0.0.1:8090/api/health >/dev/null || true

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y
apt-get install -y caddy

cat > "$CADDYFILE" <<EOF
$DOMAIN {
  encode gzip
  reverse_proxy 127.0.0.1:8090
}
EOF

systemctl restart caddy

ufw allow 80/tcp || true
ufw allow 443/tcp || true

curl -fsS "https://$DOMAIN/api/health" >/dev/null || true
echo "PocketBase deployed at https://$DOMAIN"
