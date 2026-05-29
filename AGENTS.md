# Sabagiro — Agent Handbook

> **Scope:** Work only in this repo. LariPay / Fintech Pay is separate — do not mix unless requested.

## Product

**Sabagiro** — underground club (Tbilisi): homepage, tickets, merch preview, QR tickets, admin, door scan.

| | |
|---|---|
| **Production** | https://www.sabagiro.ge |
| **Vercel** | https://sabagiro.vercel.app |
| **GitHub** | https://github.com/Ggurgenidze55/sabagiro |
| **Stack** | Next.js 14, Prisma + PostgreSQL, Vercel |

**Continue on another machine:** read **`docs/HANDOFF.md`** first.

## Local dev

```bash
cd sabagiro
npm install
cp .env.example .env.local   # fill DATABASE_URL, AUTH_SECRET, etc.
npm run dev                  # http://localhost:3001
```

Port **3001** — LariPay often uses 3000.

## Environment

| Doc | Topic |
|-----|-------|
| `docs/VERCEL.md` | Deploy env vars |
| `docs/RAILWAY.md` | PostgreSQL |
| `docs/SEO.md` | Search Console, GA4, Meta Pixel |
| `docs/RESEND.md` | Transactional email |
| `docs/EMAIL-GMAIL.md` | info@sabagiro.ge Gmail |
| `docs/WALLET.md` | Apple Wallet `.pkpass` |

Required: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`.

## Test accounts

Production admins only — no `@sabagiro.test` accounts.

| Role | Email |
|------|--------|
| Admin | `info@sabagiro.ge` / `info.sabagiro@gmail.com` |

## Architecture

| Area | Path |
|------|------|
| Homepage HTML | `public/index.html`, `app/route.ts` |
| SEO | `app/sitemap.ts`, `app/robots.ts`, `lib/analytics.ts` |
| Shop / events | `lib/events.ts`, Prisma `Product` |
| Auth | `lib/auth.ts`, `middleware.ts` |
| Tickets / QR | `lib/tickets.ts`, `lib/qr.ts` |
| Email | `lib/email/*` |
| Payments | `lib/payments/*` (TBC or test mode) |
| Apple Wallet | `lib/wallet/*` |
| UI shell | `components/SiteChrome.tsx`, `app/globals.css` |

## Deploy

```bash
npx vercel --prod --yes
```

Push to `main` → Vercel auto-deploy. Redeploy after env changes.

## User preferences

- Georgian market; UI copy mostly English
- Instant payment outcome (test simulator or TBC)
- QR visible in email (hosted image URL, not CID)
- Do not commit secrets or `.env*`

## SEO status (2026-05)

- sitemap + robots deployed
- Search Console: DNS TXT verified on Cloudflare
- GA4 / Pixel: env vars pending (`NEXT_PUBLIC_*`)
