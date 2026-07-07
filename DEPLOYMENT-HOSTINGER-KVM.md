# mysuq — Hostinger KVM (VPS) deployment (simple)

## Deploy (copy/paste)

```bash
# 1) SSH
ssh root@YOUR_SERVER_IP

# 2) Install Docker
curl -fsSL https://get.docker.com | sh

# 3) Get the code
mkdir -p ~/mysuq && cd ~/mysuq
git clone YOUR_REPO_GIT_URL .

# 4) Configure env
cp .env.example .env
nano .env

# required: POSTGRES_PASSWORD, JWT_SECRET, FRONTEND_URL, CORS_ORIGINS

# 5) Start production stack (only web exposed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 6) Check
curl -fsS http://localhost/api/health
```

Open `http://YOUR_SERVER_IP` (then add HTTPS + domain).

## HTTPS (easy option)

Put a reverse proxy on the VPS (Caddy or nginx) for your domain + SSL, and forward to the web container.

If you want Caddy, set the web container to a free port:

```bash
echo "WEB_PORT=8085" >> .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Then configure Caddy to `reverse_proxy 127.0.0.1:8085`.

