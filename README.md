# Sabagiro

Standalone site for **Sabagiro** underground club — homepage, shop (tickets + merch), cart.

**Standalone project on your Desktop** (`~/Desktop/sabagiro`) — not inside the Fintech Pay / LariPay repo. Deploy this folder only to GitHub / Vercel / Railway.

## Stack

- Next.js 14 (App Router) + PostgreSQL (Prisma)
- Static homepage (`public/index.html`)
- **User:** register, buy tickets, QR in account + email, profile/settings
- **Admin:** users, sold tickets, manual ticket + QR generation
- **Scan:** `/scan/{token}` — shows holder name, ID, email, phone

## Setup (first time)

```bash
cd ~/Desktop/sabagiro
cp .env.example .env.local
# Edit DATABASE_URL + AUTH_SECRET + APP_URL
npm install
npm run db:push
npm run seed:admin
npm run seed:events
npm run dev
```

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
5. Add **Environment Variables** (from `.env.example`):
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
3. QR is created with holder data, shown in `/account`, emailed if Resend is set.
4. Admin can generate tickets at `/admin/generate` with the same fields + instant QR.
5. Scanning QR opens `/scan/{token}` with full holder details.

Payment gateway (LariPay/Stripe) can be added later; checkout currently issues tickets directly.

## LariPay / Fintech Pay

The club site may still exist inside `Fintech Pay/integrations/shopify/georgia-pay-app/` for LariPay deploys. **This Desktop folder is your separate copy** for its own GitHub + Vercel/Railway.
