# Payments — Flitt

Sabagiro uses [Flitt](https://docs.flitt.com/) hosted checkout (`POST /api/checkout/url`).

## Flow

1. Cart / event → `POST /api/checkout` → pending order (guest checkout also sets a session cookie)
2. Server calls Flitt → `checkout_url`
3. Customer pays on Flitt page
4. Flitt → `POST /api/webhooks/flitt` (server callback) **and/or**
5. Flitt → `POST /api/payment/flitt-return` (browser return — also fulfills when signature is valid) → `/payment/return?orderId=…`
6. Return page polls `GET /api/payment/status?orderId=…` (no login required) until `PAID` / failed

## Vercel env (Production)

| Variable | Example | Notes |
|----------|---------|--------|
| `FLITT_MERCHANT_ID` | from Flitt portal | Merchant ID (Basic profile) |
| `FLITT_SECRET_KEY` | from Flitt portal | **Payment key** — not the credit private key |
| `FLITT_API_ORIGIN` | `https://pay.flitt.com` | Optional, default shown |
| `SABAGIRO_PUBLIC_URL` | `https://www.sabagiro.ge` | Return + callback URLs |
| `SABAGIRO_PAYMENTS_TEST_MODE` | `false` | Set `true` only for local simulator |

Optional override:

| Variable | Purpose |
|----------|---------|
| `FLITT_CALLBACK_URL` | Custom webhook URL |
| `SABAGIRO_PAYMENTS_TEST_MODE` | `true` = local simulator at `/payment/test` |

**Without `FLITT_MERCHANT_ID` + `FLITT_SECRET_KEY`** → test simulator (no real charge).

While Flitt merchant status is **Pending Onboarding**, approvals come back with `additional_info.is_test: true`
(“Test Approved” in the portal). Sabagiro **does not issue tickets** for those — wait until Flitt activates live charging.

## Test mode (Flitt docs)

Use test merchant `1549901` and secret `test` on `https://pay.flitt.com`.

Test cards: see [Flitt testing](https://docs.flitt.com/api/testing/).

## Webhook

- URL: `https://www.sabagiro.ge/api/webhooks/flitt`
- Method: POST JSON
- Signature: SHA1 per [docs](https://docs.flitt.com/api/building-signature/)
- Flitt IPs (optional firewall): `54.154.216.60`, `3.75.125.89`

## Amount

Prices in Sabagiro are whole GEL (e.g. `45`). Flitt API uses **minor units** (tetri): `45 GEL → 4500`.

## Refunds

Flitt refunds are done in the Flitt merchant portal (they do **not** auto-cancel Sabagiro tickets).

After you refund in Flitt:

1. Open **Admin → Tickets**
2. Find the ticket → **Cancel / refund**
3. Status becomes `CANCELLED` — door QR / wallet will not admit entry
4. That purchase slot is freed (buyer can purchase again if needed)

## Removed

TBC TPay integration removed. Old `Payment.provider = TBC` rows remain in DB for history.
