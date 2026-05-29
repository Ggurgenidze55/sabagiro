# SEO, Google Search Console, Analytics, Facebook Pixel

## Current SEO status (Sabagiro)

| Area | Status |
|------|--------|
| Title + description | ✅ root layout + pages |
| Open Graph / Twitter cards | ✅ |
| `robots.txt` | ✅ `/robots.txt` — shop public, admin/account blocked |
| `sitemap.xml` | ✅ `/sitemap.xml` — home, shop, events |
| Structured data (JSON-LD) | ⏳ not yet (optional later) |
| Page speed / mobile | ✅ responsive |
| Homepage | static HTML + events — indexable |

**Honest summary:** Basic SEO is in place. Google still needs **Search Console verification**, **sitemap submit**, and time to crawl `sabagiro.ge`. Private pages (`/admin`, `/account`) are **noindex**.

---

## 1. Google Search Console

1. https://search.google.com/search-console
2. **Add property** → **URL prefix** → `https://www.sabagiro.ge`
3. Verification — pick one:

**Option A — HTML meta tag (recommended)**

Vercel → Environment Variables:

```
GOOGLE_SITE_VERIFICATION=paste-code-from-google
```

(Redploy. Google gives something like `abc123...` — content value only, not full meta tag.)

**Option B — DNS TXT** in Cloudflare (no redeploy).

4. After verified → **Sitemaps** → add:
   ```
   https://www.sabagiro.ge/sitemap.xml
   ```
5. **URL inspection** → test `https://www.sabagiro.ge/` → Request indexing

---

## 2. Google Analytics 4 (GA4)

1. https://analytics.google.com → **Admin** → **Create property** → Sabagiro
2. **Web stream** → URL `https://www.sabagiro.ge`
3. Copy **Measurement ID** (`G-XXXXXXXXXX`)

Vercel:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Redeploy. Traffic appears in GA4 within 24h (Realtime faster).

Works on: homepage, `/shop`, all Next.js pages (via `SiteAnalytics` component).

---

## 3. Facebook / Meta Pixel

1. https://business.facebook.com → **Events Manager**
2. **Connect data sources** → **Web** → **Meta Pixel**
3. Name: Sabagiro → copy **Pixel ID** (15–16 digits)

Vercel:

```
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
```

Redeploy.

**Test:** Chrome extension [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper) → open site → should show PageView.

**Optional later:** track `Purchase` on checkout success (custom event in code).

---

## 4. Vercel checklist

| Variable | Purpose |
|----------|---------|
| `SABAGIRO_PUBLIC_URL` or `APP_URL` | `https://www.sabagiro.ge` — sitemap, OG URLs |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 |
| `NEXT_PUBLIC_META_PIXEL_ID` | Facebook Pixel |
| `GOOGLE_SITE_VERIFICATION` | Search Console meta verify |

All `NEXT_PUBLIC_*` need **Production** + redeploy.

---

## 5. What to tell SEO clients / partners

> Sabagiro.ge has technical SEO basics: meta tags, Open Graph, robots.txt, XML sitemap, and analytics hooks. Google Search Console and GA4 are configured at the domain level. Public indexable pages: homepage, shop, event pages, location. Login, admin, and checkout are excluded from search engines.

---

## URLs to check after deploy

- https://www.sabagiro.ge/robots.txt
- https://www.sabagiro.ge/sitemap.xml
