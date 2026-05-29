# Sabagiro — სხვა ლეპტოპიდან გაგრძელება

> **Repo:** https://github.com/Ggurgenidze55/sabagiro  
> **Production:** https://www.sabagiro.ge  
> **Vercel project:** `omniframe/sabagiro`

---

## 1. Clone + local setup

```bash
git clone https://github.com/Ggurgenidze55/sabagiro.git
cd sabagiro
npm install
cp .env.example .env.local
```

`.env.local`-ში ჩაწერე (Railway / Vercel-იდან ან ძველი `.env.local`-ის backup-იდან):

| Variable | სად ავიღო |
|----------|-----------|
| `DATABASE_URL` | Railway → Postgres → Variables |
| `AUTH_SECRET` | Vercel env ან `openssl rand -base64 32` |
| `APP_URL` | `https://www.sabagiro.ge` |
| `NEXT_PUBLIC_APP_URL` | `https://www.sabagiro.ge` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | `Sabagiro <info@sabagiro.ge>` |

```bash
npm run dev
# → http://localhost:3001
```

Port **3001** (LariPay ხშირად 3000-ზეა).

---

## 2. Vercel environment variables (Production)

Vercel → **omniframe/sabagiro** → Settings → Environment Variables.

### Required

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL URL |
| `AUTH_SECRET` | long random string |
| `APP_URL` | `https://www.sabagiro.ge` |
| `NEXT_PUBLIC_APP_URL` | `https://www.sabagiro.ge` |

### Email (Resend)

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `Sabagiro <info@sabagiro.ge>` |

Domain `sabagiro.ge` verified in Resend (DKIM/SPF Cloudflare-ში).

### SEO / Analytics (optional — დაამატე ID-ები)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (`G-...`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Facebook Meta Pixel |
| `GOOGLE_SITE_VERIFICATION` | Search Console meta (DNS TXT უკვე დაყენებულია — optional) |

### Apple Wallet (optional — ჯერ disabled)

See `docs/WALLET.md`. Needs Apple Developer certs + env vars.

### Payments (Flitt)

See `docs/PAYMENTS-FLITT.md`. Test mode works without Flitt creds.

**Env შეცვლის შემდეგ:** Redeploy ან `npx vercel --prod --yes`

---

## 3. Deploy commands

```bash
cd sabagiro
npx vercel --prod --yes
```

Auto-deploy: push to `main` → Vercel builds automatically.

---

## 4. Test logins

Production admins (passwords not in git):

| Email | Panel |
|-------|-------|
| `info@sabagiro.ge` | `/admin` |
| `info.sabagiro@gmail.com` | `/admin` |

No test users (`@sabagiro.test` removed).

---

## 5. DNS (Cloudflare — sabagiro.ge)

| Record | Purpose |
|--------|---------|
| CNAME `www` → `622c2553cad887ba.vercel-dns.com` | Vercel (DNS only, grey cloud) |
| CNAME `@` → same Vercel target | root redirect |
| TXT `google-site-verification=...` | Search Console ✅ |
| Resend DKIM/SPF TXT | Email |
| MX Cloudflare | Receive `info@sabagiro.ge` → Gmail |

**Note:** 2 SPF records არის — მომავალში ერთ TXT-ში გაერთიანება.

---

## 6. SEO / Search Console (2026-05-30 status)

| Step | Status |
|------|--------|
| Domain verified (DNS TXT) | ✅ |
| `sitemap.xml` live | ✅ https://www.sabagiro.ge/sitemap.xml |
| `robots.txt` live | ✅ |
| Sitemap submitted in GSC | ⏳ re-submit if still "Couldn't fetch" |
| Request indexing homepage | ⏳ URL Inspection → `https://www.sabagiro.ge/` |
| GA4 | ⏳ add `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Meta Pixel | ⏳ add `NEXT_PUBLIC_META_PIXEL_ID` |

Full guide: **`docs/SEO.md`**

---

## 7. Email setup

| Topic | Doc |
|-------|-----|
| Resend + domain | `docs/RESEND.md` |
| Gmail send/receive as info@sabagiro.ge | `docs/EMAIL-GMAIL.md` |

Send: Resend SMTP (`smtp.resend.com`, user `resend`, password = API key)  
Receive: Cloudflare Email Routing → personal Gmail

---

## 8. Recent features (main branch)

- **SEO:** `app/sitemap.ts`, `app/robots.ts`, Open Graph, `SiteAnalytics` (GA4 + Pixel)
- **Email:** QR in ticket emails (hosted URL), logo header, larger fonts
- **Free tickets:** remaining count per event, admin policy fix
- **Apple Wallet:** `.pkpass` flow (`lib/wallet/`, `docs/WALLET.md`) — needs certs
- **Instagram:** footer link → `@sabagirolisi`
- **Homepage:** full site restored from `public/index.full.html` backup
- **Fonts:** sitewide size bump (`app/globals.css`)

---

## 9. Key paths

| Area | Path |
|------|------|
| Homepage (static) | `public/index.html`, served by `app/route.ts` |
| Events admin | `/admin/events` |
| Ticket QR email | `lib/email/templates.ts`, `app/api/scan/[token]/qr/` |
| Analytics inject | `lib/analytics.ts`, `components/SiteAnalytics.tsx` |
| Shop catalog | DB via Prisma + `lib/events.ts` |

---

## 10. Do NOT commit

- `.env.local`, `.env.production.local`
- Apple Wallet `.p12` / certs
- Resend API keys

`.gitignore` already excludes these.

---

## 11. Quick checklist (new laptop)

- [ ] `git clone` + `npm install`
- [ ] `.env.local` from Vercel/Railway secrets
- [ ] `npm run dev` → localhost:3001 works
- [ ] Vercel env vars match production
- [ ] Search Console sitemap = Success
- [ ] GA4 + Pixel IDs added (if ready)
