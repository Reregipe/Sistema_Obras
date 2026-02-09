#!/bin/bash
# ============================================================
# SSL Certificate Initialization Script
# Run this ONCE on the DigitalOcean droplet to obtain the
# initial Let's Encrypt certificate for obras.engeletrica.net
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - DNS A record pointing obras.engeletrica.net to this IP
#   - Port 80 open in firewall
#   - .env file configured with Supabase credentials
#   - docker compose build already completed
# ============================================================

set -e

DOMAIN="obras.engeletrica.net"
EMAIL="${CERTBOT_EMAIL:-admin@engeletrica.net}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "${APP_DIR}"

echo "============================================"
echo "  SSL Certificate Setup for ${DOMAIN}"
echo "============================================"
echo ""

# ---- Pre-flight checks ----
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Run scripts/setup-droplet.sh first."
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# ---- Step 1: Start with HTTP-only config ----
echo "[1/5] Switching to HTTP-only nginx config..."
cp nginx/nginx-init.conf nginx/nginx-active.conf

echo "[2/5] Starting frontend container (HTTP only)..."
docker compose up -d --force-recreate frontend

# Wait for nginx to be ready
echo "      Waiting for Nginx to start..."
sleep 3
for i in $(seq 1 10); do
    if curl -s -o /dev/null -w '%{http_code}' http://localhost/ | grep -q '200'; then
        echo "      Nginx is ready."
        break
    fi
    if [ $i -eq 10 ]; then
        echo "WARNING: Nginx health check timed out, proceeding anyway..."
    fi
    sleep 2
done

# ---- Step 2: Verify DNS ----
echo "[3/5] Verifying DNS resolution..."
DROPLET_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short "${DOMAIN}" | tail -1)
echo "      Droplet IP:  ${DROPLET_IP}"
echo "      DNS resolves: ${DNS_IP}"
if [ "${DROPLET_IP}" != "${DNS_IP}" ]; then
    echo ""
    echo "WARNING: DNS does not point to this server yet!"
    echo "         Certbot may fail. Make sure your A record is configured."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting. Configure DNS first."
        exit 1
    fi
fi

# ---- Step 3: Obtain SSL certificate ----
echo "[4/5] Requesting SSL certificate from Let's Encrypt..."
docker compose run --rm --entrypoint "" certbot \
    certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "${DOMAIN}"

# ---- Step 4: Switch to HTTPS config ----
echo "[5/5] Switching to SSL nginx config and restarting..."
cp nginx/nginx.conf nginx/nginx-active.conf

docker compose restart frontend

# Start auto-renewal service
docker compose up -d certbot

echo ""
echo "============================================"
echo "  SSL setup complete!"
echo "============================================"
echo ""
echo "  Your site is live at:"
echo "    https://${DOMAIN}"
echo ""
echo "  Certificate auto-renewal is active."
echo "  Certs renew automatically every 12 hours"
echo "  (only when within 30 days of expiry)."
echo ""
echo "  To force a manual renewal:"
echo "    docker compose run --rm certbot renew --force-renewal"
echo "    docker compose restart frontend"
echo "============================================"
