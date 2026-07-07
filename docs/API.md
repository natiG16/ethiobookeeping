# mysuq API

Base URL: `http://localhost:8080/api`

## Authentication

### POST /auth/register
Local email/password registration. Creates user, business, and default categories. Sends a **verification email**; does **not** return tokens until the email is verified.

Response:
```json
{
  "email": "user@example.com",
  "verificationRequired": true,
  "message": "Check your email to verify your account before signing in."
}
```

### POST /auth/verify-email
Confirm signup from the link in the email (`{ "token": "<from query string>" }`). Returns `accessToken`, `refreshToken`, and `user` on success.

### POST /auth/resend-verification
```json
{ "email": "user@example.com" }
```
Sends a new link if the account exists and is unverified (rate-limited).

### POST /auth/login
Local email/password login. Returns `accessToken`, `refreshToken`, and `user`. Fails with an error if the email is not verified yet.

### POST /auth/google
Google Sign-In using an **ID token** from the Google client SDK.

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "businessName": "Abebe Shop",
  "businessType": "Retail",
  "phone": "+251911000000",
  "locale": "en"
}
```

| Scenario | Behavior |
|----------|----------|
| Known `google_id` | Login |
| Email exists (local account) | Link Google account, login |
| New user | Requires `businessName`; register + onboard business |

### POST /auth/refresh
```json
{ "refreshToken": "<token>" }
```

### Phone OTP (disabled by default)

`POST /auth/otp/request` and `POST /auth/otp/verify` remain in the API for a future SMS provider. They return an error unless `OTP_PHONE_ENABLED=true`. **Use Google or email** for sign-in.

### GET /notifications

In-app alerts (e.g. overdue debts). `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`.

All other endpoints require: `Authorization: Bearer <accessToken>`

## Business & bookkeeping

See previous API sections: `/businesses`, `/transactions`, `/debts`, `/dashboard`, `/reports`, `/localization`, `/users/me`.

### Categories

| Method | Path | Notes |
|--------|------|--------|
| GET | `/businesses/{businessId}/categories` | List (optional `?type=INCOME\|EXPENSE`) |
| POST | `/businesses/{businessId}/categories` | Create custom category |
| PUT | `/businesses/{businessId}/categories/{categoryId}` | Update |
| DELETE | `/businesses/{businessId}/categories/{categoryId}` | Delete (not default; not if used) |

### GET /businesses/{businessId}/transactions/export`

Same query params as transaction search. Returns `text/csv` download.

### GET /businesses/{businessId}/transactions

Query params: `type`, `from`, `to`, `search`, `paymentMethod`, `page`, `size`, `sort`.

Sort (Spring Data): repeat `sort` for multiple keys, e.g. `sort=transactionDate,desc&sort=createdAt,desc`.

Allowed sort fields: `transactionDate`, `amount`, `createdAt`, `paymentMethod`. Default: `transactionDate` descending.

### GET /businesses/{businessId}/reports/pdf

Query: `period` = `daily` | `weekly` | `monthly` (Business plan+).

Query: `period`, `locale` (`en` | `am`). PDF uses Noto Sans Ethiopic for Amharic.

PDF layout: header → **analytics summary** → transaction **statement** → **profit & loss**.

### GET /businesses/{businessId}/reports/analytics

Query: `period`. Returns transaction counts, averages, top payment method, and profit margin for the period (Business plan+).
