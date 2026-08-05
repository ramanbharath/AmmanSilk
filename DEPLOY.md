# AmmanSilks — Cloud Deployment Guide

## Architecture

```
Render.com (Free Tier)
├── Web Service:  ammansilks-api  (Node/Express)
│   ├── Serves  /api/*  routes   (backend)
│   └── Serves  /*             (Angular SPA from dist/)
└── PostgreSQL:   ammansilks-db  (managed Postgres)
```

Everything runs on **one Render web service** — no separate frontend host needed.

---

## Step 1 — Push code to GitHub

1. Create a new repo on https://github.com/new  
   Name it `ammansilks-app` (Public or Private — both work)

2. Open a terminal in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit — AmmanSilks app"
git remote add origin https://github.com/YOUR_USERNAME/ammansilks-app.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy to Render (free)

### Option A — One-click Blueprint (recommended)

1. Go to https://render.com and sign up / log in (free)
2. Click **New → Blueprint**
3. Connect your GitHub account and select the `ammansilks-app` repo
4. Render reads `render.yaml` automatically and creates:
   - A **PostgreSQL database** (`ammansilks-db`)
   - A **Web Service** (`ammansilks-api`)
5. Click **Apply** — Render builds and deploys everything

### Option B — Manual setup

1. Go to https://render.com → **New → PostgreSQL**
   - Name: `ammansilks-db`
   - Region: Singapore
   - Plan: Free → **Create Database**
   - Copy the **Internal Connection String**

2. Go to **New → Web Service**
   - Connect your GitHub repo
   - **Root Directory**: _(leave blank)_
   - **Build Command**:
     ```
     npm ci && npm run build && cd backend && npm ci
     ```
   - **Start Command**:
     ```
     node backend/server.js
     ```
   - **Environment Variables** (add these):

     | Key | Value |
     |-----|-------|
     | `NODE_ENV` | `production` |
     | `DATABASE_URL` | _(paste Internal Connection String from step 1)_ |
     | `JWT_SECRET` | _(any long random string, e.g. `amman_silks_prod_secret_2025`)_ |
     | `PORT` | `10000` |

3. Click **Create Web Service**

---

## Step 3 — Set up the database schema

After the service is deployed, open the Render **Shell** tab on your web service and run:

```bash
node backend/migrate.js
```

Then seed the initial data:

```bash
# Connect to DB and run schema.sql
# Easiest: use Render's PostgreSQL "Connect" → "PSQL Command" tab
# Paste contents of backend/schema.sql
```

Or use the Render PostgreSQL **Connect** tab and run the INSERT statements from `backend/schema.sql` to add the seed users, brokers, and products.

---

## Step 4 — Access your live app

After deploy (takes ~3 minutes), your app will be live at:

```
https://ammansilks-api.onrender.com
```

Default login credentials (from schema seed):
- **Admin**: `admin` / `admin123`
- **Staff**: `staff` / `staff123`

> ⚠️ **Change these passwords immediately** after first login using the User Management page.

---

## Local development (unchanged)

```bash
# Terminal 1 — backend
cd backend
node server.js

# Terminal 2 — frontend
npm start
# Opens http://localhost:4200
```

---

## Environment variables reference

| Variable | Local | Production |
|----------|-------|------------|
| `DATABASE_URL` | _(not used — uses individual vars)_ | Render Postgres connection string |
| `DB_HOST` | `localhost` | _(not needed if DATABASE_URL set)_ |
| `DB_PORT` | `5432` | _(not needed if DATABASE_URL set)_ |
| `DB_NAME` | `ammansilks_db` | _(not needed if DATABASE_URL set)_ |
| `DB_USER` | `postgres` | _(not needed if DATABASE_URL set)_ |
| `DB_PASSWORD` | `postgres` | _(not needed if DATABASE_URL set)_ |
| `JWT_SECRET` | `ammansilks_jwt_secret_local_dev` | Set to a strong random secret |
| `PORT` | `3000` | `10000` (Render default) |

Copy `backend/.env.example` to `backend/.env` for local development.

---

## Notes

- Render free tier **spins down after 15 min of inactivity** — first request after idle takes ~30s to wake up. Upgrade to Starter ($7/mo) to keep it always-on.
- Render free PostgreSQL **expires after 90 days** — upgrade to paid ($7/mo) or export data before expiry.
- The Angular build output at `dist/ammansilks-app/browser/` is served directly by Express in production — no separate CDN or Nginx needed.
