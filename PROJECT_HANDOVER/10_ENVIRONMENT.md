# ENVIRONMENT VARIABLES & CONFIGURATION
**Document**: `PROJECT_HANDOVER/10_ENVIRONMENT.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Environment Variables Specification

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `PORT` | Required (Platform) | `3000` | Ingress port for Cloud Run and Nginx reverse proxy |
| `NODE_ENV` | Optional | `development` / `production` | Controls Vite dev middleware vs compiled SPA static file server |
| `GEMINI_API_KEY` | Required for AI | `MY_GEMINI_API_KEY` | Server-side Gemini AI model API key |
| `APP_URL` | Optional | `https://ais-dev-...run.app` | Base URL used for self-referential links |
| `FIREBASE_PROJECT_ID` | Optional (Admin SDK) | `watch-club-membership` | Firebase Project ID for backend Admin transactions |
| `FIREBASE_CLIENT_EMAIL`| Optional (Admin SDK) | `firebase-adminsdk@...iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Optional (Admin SDK) | `-----BEGIN PRIVATE KEY-----\n...` | Service account private RSA key |
| `SQL_HOST` | Optional (SQL DB) | `localhost` or Cloud SQL IP | PostgreSQL host for Drizzle ORM |
| `SQL_USER` | Optional (SQL DB) | `postgres` | PostgreSQL username |
| `SQL_PASSWORD` | Optional (SQL DB) | `[REDACTED_SECRET]` | PostgreSQL database password |
| `SQL_DB_NAME` | Optional (SQL DB) | `watch_club_loyalty` | PostgreSQL database name |

---

## 2. Sanitized Template (.env.example)

```env
# Application Port (Hardcoded to 3000 in AI Studio Cloud Run container)
PORT=3000
NODE_ENV=production

# Gemini AI API Configuration
GEMINI_API_KEY=

# Public Application URL
APP_URL=

# Firebase Admin Service Account (Optional - server runs in resilient fallback without this)
FIREBASE_PROJECT_ID=watch-club-membership
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# PostgreSQL Database (Optional - Drizzle ORM layer)
SQL_HOST=
SQL_USER=
SQL_PASSWORD=
SQL_DB_NAME=
```
