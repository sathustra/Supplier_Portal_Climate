# Supplier PCF Portal – Frontend

React 18 + TypeScript frontend for the Supplier PCF Portal.

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS (brand colors: #1F3864 primary, #2E75B6 secondary)
- React Router v6 (HashRouter for GitHub Pages)
- React Hook Form + Zod
- Axios with JWT interceptors

---

## Local Development

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:8000
```

### 3. Start dev server

```bash
npm run dev
# Opens http://localhost:5173/supplier-portal/
```

### 4. Build for production

```bash
npm run build
# Output in dist/
```

---

## GitHub Pages Deployment

### 1. Repository setup

1. Push the project to GitHub
2. In repo **Settings → Pages**: set source to `gh-pages` branch
3. In repo **Settings → Variables → Actions**: add variable `VITE_API_URL` = your Render.com API URL (e.g. `https://ccf-supplier-api.onrender.com`)

### 2. Deploy

Push to `main` — GitHub Actions builds and deploys automatically when `frontend/**` changes.

Access the app at: `https://<your-username>.github.io/supplier-portal/`

### 3. Update CORS

Make sure `FRONTEND_URL` env var on Render.com matches your GitHub Pages URL exactly.

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (no trailing slash) |

---

## Routing

Uses `HashRouter` — all routes use `#/` prefix. No server-side config needed for GitHub Pages SPA routing.

| Hash Route | Page |
|---|---|
| `#/login` | Login |
| `#/register` | Register |
| `#/dashboard` | Submissions overview |
| `#/submissions/:id/pcf` | Wizard Step 1 – PCF data |
| `#/submissions/:id/targets` | Wizard Step 2 – Climate targets |
| `#/submissions/:id/measures` | Wizard Step 3 – Reduction measures |
| `#/submissions/:id/review` | Wizard Step 4 – Review & submit |
| `#/admin` | Admin: all submissions |
| `#/admin/:id` | Admin: submission detail + review |
| `#/admin/export` | Admin: CSV export |

---

## Demo Credentials

After backend seed runs:
- **Admin**: `admin@example.com` / `changeme` (set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars on backend)
- **Müller Kunststoffe**: `hans.mueller@mueller-kunststoffe.de` / `Demo1234!`
- **Nordic Components**: `anna.lindqvist@nordic-components.se` / `Demo1234!`
