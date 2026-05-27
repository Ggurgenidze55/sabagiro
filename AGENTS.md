# Sabagiro — Agent Handbook

> **Scope:** Work only in this repo (`~/Desktop/sabagiro`). LariPay / Fintech Pay is a separate product — do not mix unless the user requests integration.

## Product

**Sabagiro** — underground club site (Tbilisi): homepage, event tickets, merch preview, user accounts with QR tickets, admin panel, door scan.

- **Stack:** Next.js 14 App Router, Prisma + PostgreSQL, Vercel
- **Production:** https://sabagiro.vercel.app
- **GitHub:** `Ggurgenidze55/sabagiro`

## Local dev

```bash
cd ~/Desktop/sabagiro
npm run dev    # http://localhost:3001
```

Port **3001** avoids clash with LariPay on 3000.

## Environment

See `docs/VERCEL.md` and `docs/RAILWAY.md`. Required: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`.

```bash
npm run setup:db   # schema + test users + sample events
```

## Test accounts

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@sabagiro.test` | `SabagiroAdmin2026!` |
| User | `user@sabagiro.test` | `SabagiroUser2026!` |

## Architecture

| Area | Path |
|------|------|
| Homepage HTML | `public/index.html`, `app/route.ts` |
| Shop / products | `lib/products.ts`, `lib/events.ts` |
| Auth | `lib/auth.ts`, `middleware.ts` |
| Tickets / QR | `lib/tickets.ts`, `lib/qr.ts` |
| UI shell | `components/SiteChrome.tsx`, `app/globals.css` |

## Known limitations

- Checkout creates tickets without real payment (LariPay integration later if requested).
- Merch is not sold online yet.

## Deploy

Push to `main` → Vercel auto-deploy. Redeploy after env changes.
