#!/usr/bin/env bash
# Deploy EthioBooks on a Hostinger VPS (Ubuntu/Debian).
# Run as a user with Docker: curl -fsSL https://get.docker.com | sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/ethiobooks}"
REPO_URL="${REPO_URL:-}" # optional: git clone URL

echo "==> App directory: $APP_DIR"
mkdir -p "$(dirname "$APP_DIR")"

if [[ -n "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set production secrets first."
  cp -n .env.example .env || true
  echo "Edit $APP_DIR/.env then re-run this script."
  exit 1
fi

# Required production keys
source .env 2>/dev/null || true
: "${JWT_SECRET:?Set JWT_SECRET in .env}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
: "${CORS_ORIGINS:?Set CORS_ORIGINS in .env (e.g. https://yourdomain.com)}"
: "${FRONTEND_URL:?Set FRONTEND_URL in .env (e.g. https://yourdomain.com)}"

echo "==> Pull latest (if git repo)"
if [[ -d .git ]]; then
  git pull --ff-only || true
fi

echo "==> Build and start containers"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Wait for API health"
for i in {1..60}; do
  if docker compose exec -T web wget -qO- http://api:8080/api/health 2>/dev/null | grep -q UP; then
    echo "API is healthy."
    break
  fi
  sleep 2
  if [[ $i -eq 60 ]]; then
    echo "Health check timed out. Logs: docker compose logs api --tail 80"
    exit 1
  fi
done

echo "==> Done. Open http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_VPS_IP)/"
echo "    Put TLS in front (Caddy/Certbot) and point DNS to this server."
