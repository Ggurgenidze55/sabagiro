# Resend — Sabagiro email setup

Transactional email: registration, verification, tickets (QR), password reset.

## 1. Resend account

1. https://resend.com → Sign up (use `info.sabagiro@gmail.com` or club email)
2. **API Keys** → Create → copy `re_...`

## 2. Domain (production sender)

1. Resend → **Domains** → **Add Domain** → `sabagiro.ge`
2. Resend shows DNS records — add them in **Cloudflare** → DNS → Records

Typical records (exact values come from Resend dashboard):

| Type | Name | Content |
|------|------|---------|
| TXT | `@` or `sabagiro.ge` | SPF / domain verify (Resend gives exact string) |
| CNAME | `resend._domainkey` | (Resend DKIM #1) |
| CNAME | `resend2._domainkey` | (Resend DKIM #2) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` (optional but recommended) |

All records: **DNS only** (grey cloud).

Wait until Resend shows **Verified** for `sabagiro.ge`.

## 3. Vercel env vars

Project → **Settings → Environment Variables** → Production (+ Preview):

| Variable | Value |
|----------|--------|
| `RESEND_API_KEY` | `re_...` from step 1 |
| `EMAIL_FROM` | `Sabagiro <tickets@sabagiro.ge>` |

**Redeploy** after saving.

## 4. Test (before domain verified)

Resend sandbox: sender must be `onboarding@resend.dev` and recipient = your Resend account email only.

Temporary env for quick test:

```
EMAIL_FROM=Sabagiro <onboarding@resend.dev>
```

After domain verified, switch to `Sabagiro <tickets@sabagiro.ge>`.

## 5. Test from admin

1. Log in as admin → `/admin`
2. From terminal or API client:

```bash
curl -X POST https://sabagiro.ge/api/admin/email/test \
  -H "Cookie: sabagiro_session=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"to":"info.sabagiro@gmail.com"}'
```

Or in browser DevTools while logged in as admin:

```javascript
fetch('/api/admin/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'info.sabagiro@gmail.com' }),
}).then(r => r.json()).then(console.log);
```

Status check: `GET /api/admin/email/status` (admin session required).

## Emails sent automatically

| Event | Template |
|-------|----------|
| User registers | Welcome + pending verification |
| Admin verifies user | Account verified |
| Admin rejects user | Verification not approved |
| Ticket issued | QR + scan link |
| Forgot password | Reset link |
| Password changed | Confirmation |
| Email changed | Notification |

Without `RESEND_API_KEY`, emails are skipped (logged only) — tickets still appear in `/account`.
