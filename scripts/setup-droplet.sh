#!/bin/bash
# ============================================================
# DigitalOcean Droplet Setup Script
# Sistema de Gestão de Obras — obras.engeletrica.net
#
# Run this on a fresh Ubuntu 22.04+ droplet:
#   bash scripts/setup-droplet.sh
# ============================================================

set -e

echo "============================================"
echo "  DigitalOcean Droplet Setup"
echo "  Sistema de Gestão de Obras"
echo "============================================"
echo ""

# ---- 1. System Updates ----
echo "[1/6] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ---- 2. Install Docker ----
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed."
else
    echo "Docker already installed: $(docker --version)"
fi

# ---- 3. Install Docker Compose ----
echo "[3/6] Verifying Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose available: $(docker compose version --short)"
fi

# ---- 4. Install useful tools ----
echo "[4/6] Installing utilities (git, dig, curl)..."
sudo apt-get install -y git dnsutils curl

# ---- 5. Configure Firewall ----
echo "[5/6] Configuring firewall (UFW)..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
echo "Firewall configured: SSH (22), HTTP (80), HTTPS (443)"

# ---- 6. Create App Directory ----
echo "[6/6] Setting up application directory..."
APP_DIR="/opt/obras"
sudo mkdir -p ${APP_DIR}
sudo chown $USER:$USER ${APP_DIR}

DROPLET_IP=$(curl -s ifconfig.me 2>/dev/null || echo "<could not detect>")

echo ""
echo "============================================"
echo "  Droplet Setup Complete!"
echo "  Droplet IP: ${DROPLET_IP}"
echo "============================================"
echo ""
echo "Follow these steps to deploy the application:"
echo ""
echo "  1. CLONE THE REPO:"
echo "     cd ${APP_DIR}"
echo "     git clone <your-repo-url> ."
echo ""
echo "  2. CONFIGURE ENVIRONMENT:"
echo "     cp .env.example .env"
echo "     # .env already has the Supabase credentials,"
echo "     # just verify they are correct:"
echo "     cat .env"
echo ""
echo "  3. CONFIGURE DNS (before SSL):"
echo "     Add an A record in your DNS provider:"
echo "       obras.engeletrica.net → ${DROPLET_IP}"
echo "     Then wait for propagation (check with):"
echo "       dig obras.engeletrica.net"
echo ""
echo "  4. PREPARE NGINX CONFIG:"
echo "     cp nginx/nginx-init.conf nginx/nginx-active.conf"
echo ""
echo "  5. BUILD THE APP:"
echo "     docker compose build"
echo ""
echo "  6. START (HTTP) + GET SSL CERTIFICATE:"
echo "     bash scripts/init-ssl.sh"
echo ""
echo "  7. VERIFY:"
echo "     curl -I https://obras.engeletrica.net"
echo ""
echo "============================================"
