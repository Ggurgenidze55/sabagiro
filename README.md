# Sabagiro

Standalone site for **Sabagiro** underground club — homepage, shop (tickets + merch), cart.

**Standalone project on your Desktop** (`~/Desktop/sabagiro`) — not inside the Fintech Pay / LariPay repo. Deploy this folder only to GitHub / Vercel / Railway.

## Stack

- Next.js 14 (App Router) + PostgreSQL (Prisma)
- Static homepage (`public/index.html`)
- **User:** register, buy tickets, QR in account + email, profile/settings
- **Admin:** users, sold tickets, manual ticket + QR generation
- **Scan:** `/scan/{token}` — shows holder name, ID, email, phone

## Setup (first time) — DB on Railway

Full guide: **[docs/RAILWAY.md](docs/RAILWAY.md)**

```bash
cd ~/Desktop/sabagiro
cp .env.local.example .env.local
# Paste Railway DATABASE_URL + AUTH_SECRET into .env.local
npm install
npm run setup:db    # tables + test users + sample events
npm run dev
```

### Test logins (`npm run seed:test`)

| Role | Email | Password | Panel |
|------|--------|----------|--------|
| Admin | `admin@sabagiro.test` | `SabagiroAdmin2026!` | [/admin](http://localhost:3001/admin) |
| User | `user@sabagiro.test` | `SabagiroUser2026!` | [/account](http://localhost:3001/account) |

Login: http://localhost:3001/login (port **3001** — avoid clash with LariPay on 3000)

**Production (live):** https://sabagiro.vercel.app/login — do **not** use `laripay.vercel.app` for Sabagiro routes.

| URL | Role |
|-----|------|
| `/` | Homepage |
| `/shop` `/cart` | Tickets |
| `/register` `/login` | Auth |
| `/account` | User dashboard + QR tickets |
| `/account/settings` | Email, phone, password |
| `/admin` | Admin dashboard |
| `/admin/events` | Create / manage homepage events |
| `/scan/...` | QR scan (door) |

## Local dev

```bash
npm run dev
```

## Deploy on Vercel (recommended)

1. Create a **new** GitHub repo (e.g. `sabagiro-club`).
2. Push **only** the `sabagiro/` folder contents as the repo root:

   ```bash
   cd ~/Desktop/sabagiro
   git init
   git add .
   git commit -m "Initial Sabagiro standalone site"
   git remote add origin git@github.com:YOUR_USER/sabagiro-club.git
   git push -u origin main
   ```

3. [vercel.com/new](https://vercel.com/new) → Import that repo.
4. Framework: **Next.js** (auto-detected). Root directory: `.` (repo root).
5. Add **Environment Variables** (see **[docs/VERCEL.md](docs/VERCEL.md)** — `DATABASE_URL` is **required at build time**):
   - `DATABASE_URL` — Railway/Neon Postgres
   - `AUTH_SECRET`
   - `APP_URL` + `NEXT_PUBLIC_APP_URL` — your Vercel URL
   - `RESEND_API_KEY` + `EMAIL_FROM` (optional, for ticket emails)
6. Deploy, then run locally once against production DB:
   ```bash
   npm run seed:admin
   ```

Optional alias: custom domain.

## Deploy on Railway (optional)

1. New project → Deploy from GitHub (same repo as above).
2. Root directory: `/` (repo root = this Desktop folder).
3. Uses `railway.toml` — build `npm run build`, start `npm run start`.
4. Add `DATABASE_URL` later if you add Prisma/checkout DB.

## Assets

| Path | Purpose |
|------|---------|
| `public/index.html` | Fullscreen club homepage |
| `public/club/*.svg` | Logo marks |
| `public/club/sabagiro-location.png` | Location image |
| `lib/products.ts` | Shop catalog (edit prices/events here) |

## Ticket flow

1. User registers (name, surname, 11-digit personal ID, email, phone).
2. Adds tickets in `/shop` → **BUY TICKETS** in cart (must be logged in).
3. Checkout creates a **pending order**, then redirects to payment (TBC card or test simulator).
4. After payment succeeds, tickets are issued — QR in `/account`, emailed if Resend is set.
5. Admin can generate tickets at `/admin/generate` with the same fields + instant QR.
6. Scanning QR opens `/scan/{token}` with full holder details.

## Payments (standalone — not LariPay SaaS)

Code lives in `lib/payments/`. Tickets are **not** created until payment is confirmed.

| Mode | When | Flow |
|------|------|------|
| **Test** | No `TBC_CLIENT_ID` / `TBC_CLIENT_SECRET`, or `SABAGIRO_PAYMENTS_TEST_MODE=true` | `/payment/test` → simulate Pay / Cancel |
| **TBC** | Credentials set on Vercel | Redirect to TBC → webhook `/api/webhooks/tbc` → `/payment/return` |

Env (production on Vercel):

- `SABAGIRO_PUBLIC_URL` or `NEXT_PUBLIC_APP_URL` — e.g. `https://sabagiro.vercel.app`
- `TBC_ENV` — `sandbox` or `production`
- `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET`, optional `TBC_API_KEY`
- `TBC_WEBHOOK_SECRET` — optional; defaults to client secret for HMAC callbacks

After schema change: `npm run db:push`

## LariPay / Fintech Pay

The club site may still exist inside `Fintech Pay/integrations/shopify/georgia-pay-app/` for LariPay deploys. **This Desktop folder is your separate copy** for its own GitHub + Vercel/Railway.
