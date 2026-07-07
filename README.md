# mysuq — Bookkeeping Platform

Spring Boot API + **Angular** web dashboard (Tailwind CSS, mobile-first).

## Structure

```
bookeeping/
├── backend/     # Spring Boot API (JWT + Google Sign-In)
├── web/         # Angular 19 + Tailwind
├── docker-compose.yml
└── docs/API.md
```

## Quick start

### Backend

```bash
docker compose up -d postgres
cd backend
mvn spring-boot:run
```

- API: http://localhost:8080/api  
- Swagger: http://localhost:8080/api/swagger-ui.html  

### Web (Angular)

```bash
cd web
npm install
npm start
```

Open **http://localhost:4200**

### Environment

A `.env` file in the project root is used by **Docker Compose** and loaded by **Spring Boot** when you run the API from `backend/`.

If you do not have `.env` yet:

```bash
cp .env.example .env
```

Then set in `.env`:

- `GOOGLE_CLIENT_IDS` — same Web OAuth Client ID as `web/public/app-config.json`
- `CORS_ORIGINS` — must include `http://localhost:4200` (Angular dev server)
- `JWT_SECRET` — use a strong random value in production

Restart the API after changing `.env`.

### Google Sign-In (web UI)

1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an OAuth client with type **Web application** (not Desktop, Android, or iOS).
2. Under **Authorized JavaScript origins**, add the exact URL you use in the browser (no path, no trailing slash):
   - `http://localhost:4200`
   - If you ever open the app as `http://127.0.0.1:4200`, add that too — Google treats them as different origins.
3. You do **not** need a redirect URI for the Sign-In button (ID token flow).
4. Copy the **Web** client ID into `web/public/app-config.json` and backend `.env` as `GOOGLE_CLIENT_IDS`.
5. Open the app at **`http://localhost:4200`** (use `npm start` — it binds to localhost).
6. After saving origins in Google Console, wait 1–5 minutes and hard-refresh the page.

**“Access blocked: no registered origin” / Error 401 invalid_client** — the client ID is for a **Web** OAuth client, but the origin you are on is missing from that client’s **Authorized JavaScript origins** list. The login page shows the exact origin to copy when running in dev mode.

## Web stack

- Angular 19 (standalone components)
- Tailwind CSS — fintech-style UI (emerald brand)
- Mobile bottom navigation + desktop sidebar
- English / Amharic via API localization
- JWT auth + Google ID token ready

## Tests & deployment

```powershell
# Full test suite (Postgres + backend + frontend)
.\scripts\run-tests.ps1

# After docker compose up --build
.\scripts\smoke-test.ps1 -BaseUrl http://localhost:4200
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for production checklist, VPS deploy (`scripts/deploy-hostinger.sh`), manual QA (inventory, batch sales, transactions), and rollback.

## Docker (full stack)

```bash
docker compose up --build
```

- API: http://localhost:8080/api  
- Web: http://localhost:4200  
