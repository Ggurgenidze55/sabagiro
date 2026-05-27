# Railway — PostgreSQL + Sabagiro backend

## 1. Create database on Railway

1. [railway.app](https://railway.app) → New Project
2. **Add service** → **Database** → **PostgreSQL**
3. Open the Postgres service → **Variables** → copy `DATABASE_URL`  
   (looks like `postgresql://postgres:xxx@roundhouse.proxy.rlwy.net:12345/railway`)

## 2. Connect from your Mac (local dev)

In `~/Desktop/sabagiro`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://..."   # paste from Railway
AUTH_SECRET="paste-long-random-string-min-32-chars"
APP_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

Generate secret:

```bash
openssl rand -base64 32
```

## 3. Create tables + test data

```bash
cd ~/Desktop/sabagiro
npm install
npm run db:push
npm run seed:test
npm run seed:events
npm run dev
```

Open:

| URL | Login |
|-----|--------|
| http://localhost:3001/login | see test accounts below |
| http://localhost:3001/account | user dashboard |
| http://localhost:3001/admin | admin panel |

## 4. Test accounts (after `npm run seed:test`)

| Role | Email | Password |
|------|--------|----------|
| **Admin** | `admin@sabagiro.test` | `SabagiroAdmin2026!` |
| **User** | `user@sabagiro.test` | `SabagiroUser2026!` |

## 5. Deploy app on Railway (optional, same project)

1. **Add service** → **GitHub repo** → `Ggurgenidze55/sabagiro`
2. Variables (same as `.env.local`, but production URLs):

   - `DATABASE_URL` → reference Postgres service or paste URL
   - `AUTH_SECRET`
   - `APP_URL` → `https://YOUR-APP.up.railway.app`
   - `NEXT_PUBLIC_APP_URL` → same
   - `RESEND_API_KEY` + `EMAIL_FROM` (optional)

3. After first deploy, run migrations from your Mac against production DB:

   ```bash
   DATABASE_URL="postgresql://production..." npm run db:push
   DATABASE_URL="postgresql://production..." npm run seed:test
   DATABASE_URL="postgresql://production..." npm run seed:events
   ```

   Or use Railway CLI / one-off command.

## 6. Vercel + Railway DB

You can keep **frontend on Vercel** and **only DB on Railway**:

- Vercel env: `DATABASE_URL` = Railway Postgres URL
- Run `db:push` + seeds once from laptop with that URL

---

**Do not use test passwords in production** — change emails/passwords after go-live.
