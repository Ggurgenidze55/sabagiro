# Vercel deploy — required environment variables

## Correct site URL

Use **https://sabagiro.vercel.app** for login, shop, admin, and account.

- `laripay.vercel.app` is the **LariPay** app — `/login`, `/shop`, `/account` return **404** there.
- `sabagiro-club.vercel.app` is not deployed unless you create that Vercel project.

Local dev: `cd ~/Desktop/sabagiro && npm run dev` → **http://localhost:3001** (port 3001 avoids LariPay on 3000).

---

Build failed with `Environment variable not found: DATABASE_URL` means these are **not set in Vercel**.

## Fix (Project → Settings → Environment Variables)

Add **all** of these for **Production**, **Preview**, and **Development**:

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | `postgresql://...` from **Railway** | ★ Required for build + runtime |
| `AUTH_SECRET` | `openssl rand -base64 32` | Session cookies |
| `APP_URL` | `https://your-app.vercel.app` | QR links in emails |
| `NEXT_PUBLIC_APP_URL` | same as `APP_URL` | Client QR links |

Optional:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Ticket emails |
| `EMAIL_FROM` | Sender address |

## After adding variables

1. **Redeploy** (Deployments → ⋯ → Redeploy) — must use latest `main` (not old commit)
2. From your Mac, once against production DB:

   ```bash
   DATABASE_URL="postgresql://..." npm run setup:db
   ```

## Railway Postgres

Use the **public** `DATABASE_URL` from Railway Postgres service (Variables tab).

Do not commit `.env.local` to GitHub.
