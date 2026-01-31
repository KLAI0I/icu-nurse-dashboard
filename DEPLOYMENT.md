# Deployment Guide (A to Z)

This guide deploys:
- **Supabase** for Postgres + Storage
- **Backend** on Render (example; also includes Railway/Fly notes)
- **Frontend** on Vercel (example; also includes Netlify notes)

> If you already have Supabase: keep using it. Do **not** expose service role keys to the frontend.

---

## 0) Prerequisites

- Git + GitHub account
- Node.js 18+ locally
- Supabase project created
- A hosting platform account:
  - Backend: Render (or Railway/Fly)
  - Frontend: Vercel (or Netlify)

---

## 1) Put code on GitHub

1. Create a new GitHub repo: `icu-nurse-dashboard`
2. From your machine:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

---

## 2) Supabase Setup

### 2.1 Database URL for Prisma

In Supabase: **Settings → Database → Connection string**.

Use the **Direct** connection string if available for server environments.
Set it as `DATABASE_URL` in the backend environment variables.

### 2.2 Storage bucket (for documents)

1. Supabase → Storage → Create bucket:
   - Name: `icu-docs` (or your choice)
   - Visibility: **Private**
2. Do not add public policies for the bucket.

### 2.3 Service role key

Supabase → Settings → API:
- Copy **Project URL** → `SUPABASE_URL`
- Copy **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

**Security:** service role key must be used **only** on backend.

---

## 3) Backend Deployment (Render Example)

### 3.1 Create Render Web Service

1. Render → New → Web Service
2. Connect your GitHub repo
3. Select root directory: `backend`
4. Environment: Node

### 3.2 Build and Start commands

- Build Command:
```bash
npm ci && npm run prisma:generate && npm run build
```

- Start Command:
```bash
npm run prisma:migrate && node dist/server.js
```

> For Render, you can run migrations on each deploy safely. Prisma will apply only pending migrations.

### 3.3 Add environment variables (Render)

Set these in Render → Environment:

- `NODE_ENV=production`
- `PORT=4000` (Render sets PORT automatically sometimes; keep it)
- `CORS_ORIGIN=https://<your-frontend-domain>`
- `DATABASE_URL=<your-supabase-connection-string>`
- `JWT_ACCESS_SECRET=<long-random>`
- `JWT_REFRESH_SECRET=<long-random>`
- `ACCESS_TOKEN_TTL_MIN=15`
- `REFRESH_TOKEN_TTL_DAYS=30`
- `APP_TIMEZONE=Asia/Riyadh`

Storage:
- `STORAGE_DRIVER=supabase`
- `SUPABASE_URL=https://...supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_STORAGE_BUCKET=icu-docs`

Optional:
- `MAX_FILE_MB=20`

### 3.4 Deploy

Click Deploy. After deploy, note your backend URL:
- `https://your-backend.onrender.com`

Verify:
- `GET https://your-backend.onrender.com/api/health`

### 3.5 Seed production data (optional)

You typically **do not** seed production automatically.
If you want initial demo users, you can run seed once:

Render Shell (or run locally pointing DATABASE_URL to production):
```bash
npm run prisma:seed
```

---

## 4) Frontend Deployment (Vercel Example)

### 4.1 Create Vercel Project

1. Vercel → Add New → Project
2. Import your GitHub repo
3. Set root directory: `frontend`

### 4.2 Environment variables

Vercel → Project Settings → Environment Variables:

- `VITE_API_BASE=https://<your-backend-domain>/api`
- `VITE_APP_TIMEZONE=Asia/Riyadh`

### 4.3 Build settings

Vercel defaults are fine:
- Build: `npm run build`
- Output: `dist`

Deploy and get your frontend domain.

---

## 5) Configure CORS and Cookies

Because refresh tokens are stored in **httpOnly cookies**, you must:
- Backend CORS must allow credentials
- Frontend must use `withCredentials: true` (already set)
- `CORS_ORIGIN` must exactly match the frontend domain (https).

If you use multiple environments, set `CORS_ORIGIN` accordingly.

---

## 6) Supabase Storage Access (Signed URLs)

This app uses the backend to create signed URLs (private access).

In production:
- bucket should remain private
- only backend uses service role key

---

## 7) Custom Domain + HTTPS

Both Render and Vercel support custom domains.
Once you attach a domain, update:
- Backend: `CORS_ORIGIN=https://yourdomain.com`
- Frontend: `VITE_API_BASE=https://api.yourdomain.com/api` (if separate)

---

## 8) Recommended Production Hardening

- Use a managed Redis + BullMQ for scheduled reminders
- Add email provider for reset password + notifications
- Add virus scanning (ClamAV or cloud scanner)
- Add request logging to an APM (Sentry / Datadog)
- Configure database connection pooling (Supabase pooler)
- Add pagination for large staff lists

---

## 9) Troubleshooting

### 9.1 401 loops
- Frontend must call backend with `withCredentials: true`
- CORS must allow credentials
- `CORS_ORIGIN` must match exactly

### 9.2 Prisma cannot connect
- Use the correct Supabase connection string
- Ensure IP allowlist / network settings if applicable

### 9.3 Storage signed URL fails
- Ensure bucket exists and is private
- Service role key is correct and set on backend

