# info@sabagiro.ge — Gmail send & receive (free)

Use **info.sabagiro@gmail.com** in Gmail, but the world sees **info@sabagiro.ge**.

| Direction | How |
|-----------|-----|
| **Receive** | Cloudflare Email Routing → forward to Gmail |
| **Send (manual from Gmail)** | Gmail “Send mail as” → Resend SMTP |
| **Send (website auto)** | Already via Resend API + `EMAIL_FROM` on Vercel |

---

## Part 1 — Receive mail at info@sabagiro.ge (Cloudflare)

1. **Cloudflare** → domain `sabagiro.ge` → **Email** → **Email Routing** → **Get started** / **Enable**
2. Cloudflare adds **MX records** automatically (approve if prompted)
3. **Routing rules** → **Create address**:
   - Custom address: `info`
   - Action: **Send to an email** → `info.sabagiro@gmail.com`
4. Save

**Test:** from another email send to `info@sabagiro.ge` → should arrive in Gmail within 1–2 minutes.

> DNS must use Cloudflare nameservers (not domenebi parking). MX must point to Cloudflare, not domenebi.

---

## Part 2 — Send from Gmail as info@sabagiro.ge (Resend SMTP)

Requires **Resend domain verified** (`sabagiro.ge` ✅) and API key.

### Gmail (desktop)

1. Gmail → **Settings** (gear) → **See all settings**
2. Tab **Accounts and Import**
3. **Send mail as** → **Add another email address**
4. Fill in:
   - Name: `Sabagiro`
   - Email: `info@sabagiro.ge`
   - ☐ Treat as alias (optional)
5. **Next** → **Send through SMTP server**:
   - SMTP server: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your **Resend API key** (`re_...`)
   - ☑ Secured connection using SSL
6. **Add account**
7. Gmail sends verification to `info@sabagiro.ge` → arrives in Gmail via forwarding (Part 1) → click link or enter code

### When composing email

- **From** dropdown → choose **info@sabagiro.ge**
- Or set **info@sabagiro.ge** as default in Accounts settings

---

## Part 3 — Website (already done)

Vercel:

```
EMAIL_FROM=Sabagiro <info@sabagiro.ge>
RESEND_API_KEY=re_...
```

Registration, tickets, password reset send automatically from `info@sabagiro.ge`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Mail to info@sabagiro.ge not arriving | Cloudflare Email Routing enabled? MX = Cloudflare? Not domenebi parking |
| Gmail SMTP auth failed | API key correct? Username must be `resend` (lowercase) |
| Verification email not received | Complete Part 1 first (forwarding) |
| Sent mail goes to spam | Resend DKIM/SPF verified; warm up with normal volume |

---

## Optional — Google Workspace

If you want full mailbox (Calendar, Drive @sabagiro.ge) without forwarding tricks → [Google Workspace](https://workspace.google.com) (~$6/user/month). Not required for Sabagiro site.
