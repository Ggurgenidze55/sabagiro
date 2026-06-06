# Vercel deploy — required environment variables

## Correct site URL

Use **https://www.sabagiro.ge** (or **https://sabagiro.vercel.app**) for login, shop, admin, and account.

- `laripay.vercel.app` is the **LariPay** app — Sabagiro routes return **404** there.

Local dev: `cd sabagiro && npm run dev` → **http://localhost:3001** (port 3001 avoids LariPay on 3000).

**Handoff (new machine):** [docs/HANDOFF.md](HANDOFF.md)

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
| `RESEND_API_KEY` | All transactional emails (tickets, registration, reset, verification) |
| `EMAIL_FROM` | Sender address (must be verified in Resend) — e.g. `Sabagiro <info@sabagiro.ge>` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (`G-...`) — see `docs/SEO.md` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Facebook Meta Pixel — see `docs/SEO.md` |
| `GOOGLE_SITE_VERIFICATION` | Search Console meta tag (optional if DNS TXT verified) |
| `APPLE_WALLET_*` | Apple Wallet `.pkpass` — see `docs/WALLET.md` |
| `FLITT_MERCHANT_ID` | Flitt merchant ID — see `docs/PAYMENTS-FLITT.md` |
| `FLITT_SECRET_KEY` | Flitt payment secret key |
| `FLITT_API_ORIGIN` | Optional — default `https://pay.flitt.com` |
| `CRON_SECRET` | Vercel Cron auth for weekly artist tickets (`openssl rand -base64 32`) |

## After adding variables

1. **Redeploy** (Deployments → ⋯ → Redeploy) — must use latest `main` (not old commit)
2. From your Mac, once against production DB:

   ```bash
   DATABASE_URL="postgresql://..." npm run setup:db
   ```

## Railway Postgres

Use the **public** `DATABASE_URL` from Railway Postgres service (Variables tab).

Do not commit `.env.local` to GitHub.
