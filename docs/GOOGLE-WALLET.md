# Google Wallet — Sabagiro tickets (Android)

Users can add tickets to **Google Wallet** from `/account` → **Add to Google Wallet** on **Android** (Chrome or Sabagiro app).

Until configured, the button stays hidden (same as Apple Wallet before certs).

---

## Requirements

1. **Google Cloud** project with **Google Wallet API** enabled
2. **Google Pay & Wallet Console** — Issuer account (business verification)
3. **Service account** with Wallet API issuer permissions
4. Vercel env vars (below)

The button is shown **only on Android** (not iPhone, desktop).

---

## 1. Google Cloud

1. https://console.cloud.google.com → create or select project
2. **APIs & Services → Library** → enable **Google Wallet API**
3. **IAM & Admin → Service Accounts** → **Create**
4. Grant role: **Google Wallet API Admin** (or issuer role from Wallet console)
5. **Keys → Add key → JSON** — download (keep secret, not in git)

---

## 2. Google Pay & Wallet Console

1. https://pay.google.com/business/console
2. **Google Wallet API** → Get started / Create issuer
3. Note your **Issuer ID** (numeric, e.g. `3388000000001234567`)
4. Link the **service account email** from step 1 as an authorized issuer
5. Complete business verification for production (`APPROVED` passes)

**Demo / testing:** use `GOOGLE_WALLET_REVIEW_STATUS=UNDER_REVIEW` (default). Add test accounts in the console.

---

## 3. Vercel environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_WALLET_ISSUER_ID` | Issuer ID from Wallet console |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON` | Full service account JSON (paste or base64) **or** use split vars below |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` | `client_email` from JSON (if not using full JSON) |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` | `private_key` PEM (if not using full JSON) |
| `GOOGLE_WALLET_REVIEW_STATUS` | `UNDER_REVIEW` (demo) or `APPROVED` (live) |
| `GOOGLE_WALLET_CLASS_SUFFIX` | Optional — default `sabagiro-ticket` |

**Redeploy** after adding.

---

## 4. Test

1. Android phone → https://www.sabagiro.ge/account (Chrome or Sabagiro APK)
2. **View ticket** → **Add to Google Wallet**
3. Google Wallet app should open and offer to save the pass

API: `GET /api/tickets/{id}/google-wallet` → `{ saveUrl }`  
Status: `GET /api/wallet/status` → `{ googleWallet: true }` on Android UA

---

## 5. Android app

The WebView opens `pay.google.com` in the system browser / Wallet app (see `SabagiroWebViewClient.kt`).

Rebuild APK after wallet changes: `npm run android:publish-apk`

---

## Notes

- QR on the pass uses the same scan URL as site/email (`/scan/{token}`)
- Apple Wallet remains separate — see `docs/WALLET.md`
- Pass updates (USED at door) via Google Wallet API PATCH — future enhancement
