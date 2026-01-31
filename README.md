# ICU Nurse Staff Dashboard (Full Stack)

A responsive, production-ready web application with **role-based access** (ADMIN vs STAFF), audit logs, document uploads (Supabase Storage or local dev), and Supabase Postgres database.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind (clinical light UI), React Router, Axios
- **Backend:** Node.js + Express + TypeScript
- **DB:** PostgreSQL on **Supabase** using Prisma migrations + seed data
- **Auth:** JWT access tokens + refresh tokens (httpOnly cookie), password hashing (bcrypt), rate limiting, Helmet
- **RBAC:** ADMIN (ICU Head) and STAFF, enforced in UI and backend
- **Storage:** Supabase Storage (signed URLs) or Local Storage (dev)
- **Audit Log:** Tracks staff field changes + document operations
- **Timezone:** Asia/Riyadh used for all date calculations

---

## Demo Accounts (after seed)

- **Admin:** `admin@icu.local` / `Admin@12345`
- **Staff:** `staff0@icu.local` / `Staff@12345`  (linked to a staff record)

---

## Repo Structure

```
icu-nurse-dashboard/
  backend/
  frontend/
```

---

## Local Development (A to Z)

### 1) Create Supabase project

1. Create a Supabase project.
2. Copy the **Postgres connection string** for Prisma (Settings → Database → Connection string).
3. (Optional) Create a private Storage bucket named: `icu-docs` (or change env var).

### 2) Backend

```bash
cd backend
cp .env.example .env
# edit .env: DATABASE_URL + JWT secrets + (optional) SUPABASE storage keys
npm i
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend runs at: `http://localhost:4000`

### 3) Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_API_BASE=http://localhost:4000/api
npm i
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Production Deployment (A to Z)

See **DEPLOYMENT.md** for step-by-step deployment on:
- Backend: Render / Railway / Fly.io (recommended)
- Frontend: Vercel / Netlify
- Supabase: Postgres + Storage

---

## Environment Variables Summary

### Backend (.env)

- `DATABASE_URL` (Supabase Postgres)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` (frontend URL)
- `STORAGE_DRIVER` = `supabase` or `local`
- For Supabase Storage:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`

### Frontend (.env)

- `VITE_API_BASE` (backend URL + `/api`)
- `VITE_APP_TIMEZONE=Asia/Riyadh`

---

## API Docs

See `backend/OPENAPI.md` for endpoint list + example payloads.

---

## Notes

- Forgot/reset password endpoints are stubbed; integrate SendGrid/Mailgun later.
- Virus scanning hook placeholder exists (integrate ClamAV or a cloud scanner).
