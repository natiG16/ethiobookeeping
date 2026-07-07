# mysuq — Hostinger KVM (VPS) deployment (simple)

This deploys **web + api + postgres** on a single Hostinger KVM VPS using Docker Compose.

## What you’ll run

- **Web**: nginx container serving Angular + proxying `/api` to the backend
- **API**: Spring Boot container (Flyway runs automatically)
- **DB**: PostgreSQL container (not exposed publicly in production)

## 1) VPS prerequisites (Ubuntu 22.04/24.04)

SSH into the server:

```bash
ssh root@YOUR_SERVER_IP
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER || true
```

Re-login so group permissions apply (or run the next commands with `sudo`).

## 2) Get the code on the server

```bash
mkdir -p ~/mysuq && cd ~/mysuq
git clone YOUR_REPO_GIT_URL .
```

## 3) Create production `.env`

```bash
cp .env.example .env
nano .env
```

Minimum required (production):

- `POSTGRES_PASSWORD` (strong)
- `JWT_SECRET` (strong, 32+ chars)
- `FRONTEND_URL` (your HTTPS URL, e.g. `https://app.yourdomain.com`)
- `CORS_ORIGINS` (exact origin, e.g. `https://app.yourdomain.com`)

Recommended:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `GOOGLE_CLIENT_IDS` (if using Google Sign-in)
- `MAIL_*` (if using email verification)

## 4) Start the stack (production compose)

This uses `docker-compose.prod.yml` which:
- **does not expose** Postgres/API to the public internet
- exposes **only the web container**

```bash
chmod +x scripts/deploy-hostinger.sh scripts/smoke-test.sh
./scripts/deploy-hostinger.sh
```

Verify:

```bash
./scripts/smoke-test.sh http://YOUR_SERVER_IP
```

## 5) Put HTTPS + domain (recommended: Caddy on the host)

Because the web container binds to port **80** by default, the simplest TLS setup is:
- change web to bind on **8085**
- run **Caddy** on the host for ports **80/443**

### 5.1 Set web port

In `~/mysuq/.env` add:

```bash
WEB_PORT=8085
```

Restart:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 5.2 Install Caddy

```bash
apt update
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
```

### 5.3 Configure Caddy

Edit:

```bash
nano /etc/caddy/Caddyfile
```

Example:

```caddy
app.yourdomain.com {
  reverse_proxy 127.0.0.1:8085
}
```

Reload:

```bash
systemctl reload caddy
```

Now run:

```bash
./scripts/smoke-test.sh https://app.yourdomain.com
```

## 6) Updates

From `~/mysuq`:

```bash
git pull --ff-only
./scripts/deploy-hostinger.sh
```

## Notes

- **Backups**: Postgres is stored in a Docker volume (`postgres_data`). Take periodic backups with `pg_dump` (recommended).
- **Uploads**: Stored in `upload_data` Docker volume (set by `UPLOAD_DIR`).
- **Logs**: `docker compose logs -f api` / `docker compose logs -f web`

