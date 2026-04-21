# Supplier PCF Portal – Backend

FastAPI backend for collecting Product Carbon Footprints (PCF) and climate reduction targets from suppliers.

## Tech Stack

- Python 3.12, FastAPI, SQLAlchemy 2.0 async, Pydantic v2
- PostgreSQL via Neon.tech (asyncpg driver)
- JWT auth (python-jose + passlib/bcrypt)
- Alembic migrations
- Deployment: Render.com Free Tier via Docker

---

## Local Development Setup

### 1. Prerequisites

- Python 3.12+
- A [Neon.tech](https://neon.tech) account (free tier is sufficient)

### 2. Create Neon Database

1. Sign up at neon.tech and create a new project
2. Copy the connection string — it looks like:
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Replace `postgresql://` with `postgresql+asyncpg://` for async support

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host/db` |
| `JWT_SECRET` | Random string, min 32 chars |
| `FRONTEND_URL` | CORS origin (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | Email for the auto-created admin account |
| `ADMIN_PASSWORD` | Initial password for the admin account |

### 4. Install Dependencies & Run Migrations

```bash
pip install -r requirements.txt
alembic upgrade head
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

---

## Seed Data

On first startup, the app auto-seeds:
- 1 admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Müller Kunststoffe GmbH (DE) — submitted submission with 3 PCFs, SBTi committed, 2 measures
- Nordic Components AB (SE) — draft submission with 2 PCFs, SBTi validated near-term, 3 measures

Demo supplier passwords: `Demo1234!`

---

## Deployment on Render.com

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create Render Service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repository
3. Render detects the `Dockerfile` automatically
4. Set environment variables in Render dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET` — auto-generated or set manually
   - `FRONTEND_URL` — your frontend URL
   - `ADMIN_EMAIL` — admin login email
   - `ADMIN_PASSWORD` — admin initial password

Alternatively, use the `render.yaml` Blueprint:
1. Render dashboard → New → Blueprint
2. Connect repo — it reads `render.yaml` automatically

### 3. Keep-Alive

The free Render tier spins down after inactivity. Use an external ping service (e.g. UptimeRobot) to hit `GET /health` every 10 minutes.

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Supplier self-registration |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | JWT | Own profile |
| POST | `/api/submissions` | JWT | Create submission period |
| GET | `/api/submissions` | JWT | List own submissions |
| GET | `/api/submissions/{id}` | JWT | Submission detail |
| PATCH | `/api/submissions/{id}/submit` | JWT | Submit for review |
| POST | `/api/submissions/{id}/pcf-records` | JWT | Add PCF record |
| GET | `/api/submissions/{id}/pcf-records` | JWT | List PCF records |
| PUT | `/api/pcf-records/{id}` | JWT | Update PCF record |
| DELETE | `/api/pcf-records/{id}` | JWT | Delete PCF record |
| PUT | `/api/submissions/{id}/reduction-target` | JWT | Upsert climate target |
| GET | `/api/submissions/{id}/reduction-target` | JWT | Get climate target |
| POST | `/api/submissions/{id}/measures` | JWT | Add reduction measure |
| GET | `/api/submissions/{id}/measures` | JWT | List measures |
| PUT | `/api/measures/{id}` | JWT | Update measure |
| DELETE | `/api/measures/{id}` | JWT | Delete measure |
| GET | `/api/admin/submissions` | Admin JWT | All submissions |
| GET | `/api/admin/submissions/{id}` | Admin JWT | Admin detail view |
| PATCH | `/api/admin/submissions/{id}/review` | Admin JWT | Approve/reject |
| GET | `/api/admin/export/pcf` | Admin JWT | CSV export PCFs |
| GET | `/api/admin/export/measures` | Admin JWT | CSV export measures |
| GET | `/health` | — | Health check |

Full interactive docs: `/docs` (Swagger UI)
