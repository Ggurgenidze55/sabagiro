# Railway — PostgreSQL + Sabagiro backend

## 1. Create database on Railway

1. [railway.app](https://railway.app) → New Project
2. **Add service** → **Database** → **PostgreSQL**
3. Open the Postgres service → **Variables** → copy `DATABASE_URL`  
   (looks like `postgresql://postgres:xxx@roundhouse.proxy.rlwy.net:12345/railway`)

## 2. Connect from your Mac (local dev)

In `sabagiro`:

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

## 3. Create tables + sample events

```bash
cd sabagiro
npm install
npm run db:push
npm run seed:events
npm run dev
```

Open http://localhost:3001/login — use production admin emails (see `docs/HANDOFF.md`).

## 4. Production admins

| Email | Role |
|-------|------|
| `info@sabagiro.ge` | ADMIN |
| `info.sabagiro@gmail.com` | ADMIN |

Passwords are **not** in git. Created via `scripts/reset-production-admins.mjs` or `npm run seed:admin` with env vars.

## 5. Deploy app on Railway (optional, same project)

1. **Add service** → **GitHub repo** → `Ggurgenidze55/sabagiro`
2. Variables (same as `.env.local`, but production URLs):

   - `DATABASE_URL` → reference Postgres service or paste URL
   - `AUTH_SECRET`
   - `APP_URL` → `https://www.sabagiro.ge`
   - `NEXT_PUBLIC_APP_URL` → same
   - `RESEND_API_KEY` + `EMAIL_FROM` (optional)

3. After first deploy, run migrations from your Mac:

   ```bash
   npm run db:migrate
   npm run seed:events
   ```

4. Set `CRON_SECRET` in Vercel (Production + Preview) so `/api/cron/artist-tickets` runs every **Thursday 20:00 Tbilisi** (16:00 UTC).

## 6. Vercel + Railway DB (current setup)

**Frontend on Vercel**, **DB on Railway**:

- Vercel env: `DATABASE_URL` = Railway Postgres URL
- Vercel env: `APP_URL` + `NEXT_PUBLIC_APP_URL` = `https://www.sabagiro.ge`
- Run `db:push` / migrations once from laptop with production `DATABASE_URL`

---

**No test accounts** — `user@sabagiro.test` / `admin@sabagiro.test` removed from production.
