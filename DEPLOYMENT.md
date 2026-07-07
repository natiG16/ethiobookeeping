# mysuq / EthioBooks — Deployment Plan & Strategy

## System overview

| Layer | Stack | Port (default) |
|-------|--------|----------------|
| Frontend | Angular 19, nginx (Docker) | 80 → mapped 4200 (dev compose) |
| API | Spring Boot 3.4, Java 21 | 8080 (`/api` context) |
| Database | PostgreSQL 16 + Flyway | 5432 |

**Current schema:** Flyway migrations **V1–V15** (V15 adds `transactions.product_id` + `product_quantity` for inventory-linked sales).

---

## Simple deployment (recommended)

For now, use the short guide in **`DEPLOYMENT-HOSTINGER-KVM.md`** (Docker Compose on a single VPS).

---

## Manual QA before go-live

Use a **Business** plan account (write access). Confirm on staging with production-like data.

### Auth & core

- [ ] Register / login (email + password)
- [ ] Google Sign-In (production OAuth origins configured)
- [ ] Email verification flow (`MAIL_*`, `FRONTEND_URL`)
- [ ] Create business, switch business, settings save

### Transactions

- [ ] **Single income** — pick inventory product → amount auto-fills from sell price × qty
- [ ] **Single income** — type custom item (no inventory) in product combobox; dropdown filters as you type
- [ ] **Single expense** — category dropdown, payment method, save
- [ ] Transaction list loads (no “unexpected error”); search, filters, pagination
- [ ] Transaction detail edit/delete
- [ ] Export CSV

### Multiple income / expense (batch)

- [ ] Toolbar: **Multiple income** / **Multiple expense** buttons → batch page
- [ ] Batch income: product combobox, qty (whole numbers only), amount, payment, category
- [ ] Batch income: sell price auto-fill when inventory product selected
- [ ] Batch income: “Customer gets …” hint per row; footer total units
- [ ] **Save all** via `/transactions/sync`

### Inventory

- [ ] Add product with sell price, unit, opening stock
- [ ] Record sale linked to product → **Available** stock decreases, **Sold** increases
- [ ] Manual stock adjust (`POST /products/{id}/adjust`)
- [ ] Low-stock indicator on dashboard when below threshold

### Reports & billing

- [ ] PDF report (Business+ plan, date range)
- [ ] Upgrade modal / plan limits for read-only tier
- [ ] Debts, suppliers, customers (if used)

### Admin (optional)

- [ ] Admin login → user list → deactivate test user

---

## Pre-deployment configuration

### 1. Secrets & environment

Copy `.env.example` → `.env` (never commit `.env`). Set production values:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Min 256-bit random string |
| `POSTGRES_PASSWORD` / `DB_*` | Production PostgreSQL credentials |
| `CORS_ORIGINS` | Exact frontend origin(s), e.g. `https://app.mysuq.com` |
| `FRONTEND_URL` | Base URL for email links, e.g. `https://app.mysuq.com` |
| `GOOGLE_CLIENT_IDS` | Production OAuth Web client ID |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin (change after first login) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM` | SMTP for signup verification |
| `OTP_SECRET`, `TELEGRAM_*` | Phone OTP (if `OTP_PHONE_ENABLED=true`) |
| `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Token lifetimes |

**Frontend** (`web/src/environments/environment.production.ts` + build):

- `apiUrl`: `/api` when nginx proxies to API (Docker Compose); or `https://api.yourdomain.com/api`
- `googleClientId` + `web/public/app-config.json` for Google Sign-In
- Support contact fields (`supportEmail`, etc.)

### 2. Payment logos

Place PNG/SVG in `web/public/payment-methods/` and **rebuild** the web image (assets are baked at build time).

### 3. Database migrations

Flyway runs automatically on API startup. **V15** must apply on first deploy after this release:

```sql
-- transactions.product_id, transactions.product_quantity
```

No manual SQL needed if API starts cleanly. Check logs for `Successfully applied` or `Schema is up to date`.

---

## Deployment strategies

### Strategy A — Docker Compose (recommended for VPS / single server)

Best for: first production, staging, small teams.

**Local / staging**

```powershell
# 1. Copy .env.example → .env and edit secrets
# 2. Build and start full stack
cd d:\bookeeping
docker compose up -d --build
```

**URLs (dev compose)**

- App: `http://localhost:4200` (nginx → Angular, proxies `/api` → `api:8080`)
- API direct: `http://localhost:8080/api`
- Health: `http://localhost:4200/api/health`
- Swagger: `http://localhost:8080/api/swagger-ui.html`

**Hostinger VPS (production)**

```bash
# On the VPS (Ubuntu), install Docker, clone the repo, then:
cp .env.example .env
nano .env   # JWT_SECRET, POSTGRES_PASSWORD, CORS_ORIGINS, FRONTEND_URL, mail, Google, admin

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

curl -fsS http://localhost/api/health
```

Production compose closes public ports on Postgres/API and serves the app on port **80**:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Put **HTTPS** in front with Hostinger’s panel, **Caddy**, or **Certbot** (Let’s Encrypt). Set `CORS_ORIGINS` and `FRONTEND_URL` to your `https://` domain.

**Notes**

- Postgres data: volume `postgres_data`
- Uploads: volume `upload_data` (profile pictures, payment logos)
- Rotate `JWT_SECRET` and DB password before go-live
- Do not expose plain HTTP publicly long-term

### Strategy B — AWS (recommended for cloud)

Use the same Docker Compose approach on any VPS. (AWS-specific guide removed.)

| Component | AWS service |
|-----------|-------------|
| PostgreSQL | RDS PostgreSQL 16 (private subnet) |
| API + Web | ECS Fargate (ECR images from `backend/` + `web/` Dockerfiles) |
| HTTPS / routing | ACM + Application Load Balancer (`/api/*` → API, `/*` → web) |
| Secrets | Secrets Manager |
| Uploads | EFS on API task (`UPLOAD_DIR`) |
| Email | Amazon SES |
| DNS | Route 53 |

**Fast path:** Any VPS/VM using Docker Compose (same steps as Hostinger KVM).

### Strategy C — Split hosting (other clouds)

| Component | Suggested hosting |
|-----------|-------------------|
| PostgreSQL | Managed DB (RDS, Cloud SQL, Supabase, Neon) |
| API | Container service (ECS, Cloud Run, Fly.io, Railway) or VM + systemd |
| Static web | S3 + CloudFront, Netlify, Vercel, or nginx on VM |

**API env:** point `DB_URL` to managed Postgres; set `CORS_ORIGINS` to the static site URL.

**Web build:**

```bash
cd web
npm ci
npm run build:prod
# Deploy dist/web/browser to CDN; set apiUrl to https://api.yourdomain.com/api
```

### Strategy D — CI/CD pipeline

1. **On PR:** `mvn test`, `npm run test:ci`, `npm run build:prod`
2. **On merge to main:** build Docker images → push to registry (GHCR/ECR)
3. **Deploy:** pull images on server or trigger Compose rollout
4. **Migrations:** Flyway on API startup

```
lint/build → test → docker build → deploy staging → smoke test → deploy production
```

---

## Production hardening

1. **HTTPS only** — redirect HTTP → HTTPS; HSTS at edge.
2. **CORS** — remove wildcard patterns; list exact production origins.
3. **Secrets** — use a secret manager (not plain `.env` on shared VMs).
4. **Database** — automated backups, PITR if available; restrict network to API only.
5. **Admin** — strong `ADMIN_PASSWORD`; limit admin panel by IP or VPN if possible.
6. **Monitoring** — health check `GET /api/health`, logs (`docker compose logs -f api web`), DB disk alerts.
7. **Uploads** — persisted in Docker volume `upload_data`.
8. **Google OAuth** — add production domain to authorized JavaScript origins in Google Cloud Console.
9. **Swagger** — restrict `/api/swagger-ui.html` in production (firewall or Spring config).

---

## Rollout plan (phased)

| Phase | Actions |
|-------|---------|
| **0 — Staging** | Deploy Compose on staging VPS; run automated tests + manual QA checklist above. |
| **1 — Soft launch** | Limited users; monitor logs, DB size, stock/sale accuracy. |
| **2 — Production** | DNS → TLS → production `.env`; disable default passwords. |
| **3 — Post-launch** | CI/CD, error tracking (Sentry), uptime checks, expand integration tests. |

---

## Rollback

1. **API / Web:** redeploy previous Docker image tag or previous `dist` artifact.
2. **Database:** Flyway migrations are forward-only; restore from backup if a bad migration shipped (test migrations on staging first).
3. **Config:** keep previous `.env` snapshot per release.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Transaction list “unexpected error” | DB migration missing / lazy-load | Ensure API restarted after deploy; check Flyway V15 applied |
| Stock not decreasing | Sale without `productId` | Link sale to inventory product in income form |
| Amount not auto-filling | Product has no sell price | Set sell price in Inventory |
| Google login blocked | Origin not registered | Add exact browser URL to OAuth client origins |
| CORS errors | Wrong `CORS_ORIGINS` | Match frontend URL exactly (scheme + host + port) |
| Email verification broken | SMTP / `FRONTEND_URL` | Test `MAIL_*`; links must use public `FRONTEND_URL` |
| `docker compose` API unhealthy | Postgres not ready | `docker compose logs api postgres`; wait for healthy DB |

**Logs:**

```bash
docker compose logs -f api web
docker compose ps
```

**Local dev without Docker for API:**

```bash
docker compose up -d postgres
cd backend && mvn spring-boot:run
cd web && npm start
```

---

## Local vs production differences

| Item | Local | Production |
|------|-------|------------|
| `apiUrl` | `http://localhost:8080/api` (dev) or `/api` (Docker web) | `/api` (proxied) or full API URL |
| CORS | Permissive localhost patterns | Exact domain |
| JWT secret | Dev default | Strong random |
| Postgres | Docker / local | Managed or secured instance |
| Compose ports | 4200, 8080, 5432 exposed | Prod overlay: only web port 80 |

---

## Support

Configure customer-facing contacts in `environment.production.ts`. Operational admin uses `/admin/accounts` with bootstrap credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
