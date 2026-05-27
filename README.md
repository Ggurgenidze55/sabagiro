# Sabagiro

Standalone site for **Sabagiro** underground club — homepage, shop (tickets + merch), cart.

**Standalone project on your Desktop** (`~/Desktop/sabagiro`) — not inside the Fintech Pay / LariPay repo. Deploy this folder only to GitHub / Vercel / Railway.

## Stack

- Next.js 14 (App Router)
- Static homepage (`public/index.html` — brutalist fullscreen)
- `/shop` — product catalog
- `/cart` — browser localStorage cart (checkout placeholder)

## Local dev

```bash
cd ~/Desktop/sabagiro
npm install
npm run dev
```

- Home: http://localhost:3000/
- Shop: http://localhost:3000/shop
- Cart: http://localhost:3000/cart

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
5. Deploy. No env vars required for the current version.

Optional alias: `sabagiro.vercel.app` or your custom domain.

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

## Payment (next step)

Cart **CHECKOUT** is a placeholder. To go live:

1. Connect LariPay, Stripe, or BOG from `.env.example` variables.
2. Implement `app/api/checkout/route.ts` and wire `CartView` button.

## LariPay / Fintech Pay

The club site may still exist inside `Fintech Pay/integrations/shopify/georgia-pay-app/` for LariPay deploys. **This Desktop folder is your separate copy** for its own GitHub + Vercel/Railway.
