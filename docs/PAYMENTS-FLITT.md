# Payments — Flitt

Sabagiro uses [Flitt](https://docs.flitt.com/) hosted checkout (`POST /api/checkout/url`).

## Flow

1. Cart → `POST /api/checkout` → pending order
2. Server calls Flitt → `checkout_url`
3. Customer pays on Flitt page
4. Flitt → `POST /api/webhooks/flitt` (server callback)
5. Flitt → `POST /api/payment/flitt-return` → redirect → `/payment/return?orderId=…`

## Vercel env (Production)

| Variable | Example | Notes |
|----------|---------|--------|
| `FLITT_MERCHANT_ID` | `1549901` | Merchant portal → Technical settings |
| `FLITT_SECRET_KEY` | `test` or live secret | Payment secret key |
| `FLITT_API_ORIGIN` | `https://pay.flitt.com` | Optional, default shown |
| `SABAGIRO_PUBLIC_URL` | `https://www.sabagiro.ge` | Return + callback URLs |

Optional override:

| Variable | Purpose |
|----------|---------|
| `FLITT_CALLBACK_URL` | Custom webhook URL |
| `SABAGIRO_PAYMENTS_TEST_MODE` | `true` = local simulator at `/payment/test` |

**Without `FLITT_MERCHANT_ID` + `FLITT_SECRET_KEY`** → test simulator (no real charge).

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

## Removed

TBC TPay integration removed. Old `Payment.provider = TBC` rows remain in DB for history.
