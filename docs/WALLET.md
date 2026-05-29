# Apple Wallet — Sabagiro tickets

Users can add tickets to **Apple Wallet** from `/account` → **Add to Apple Wallet** (iPhone Safari / macOS).

## Requirements

1. **Apple Developer Program** ($99/year) — https://developer.apple.com
2. Pass Type ID certificate
3. Vercel env vars (below)

Until configured, the wallet button stays hidden.

---

## 1. Apple Developer setup

1. **Certificates, Identifiers & Profiles** → **Identifiers** → **+** → **Pass Type IDs**
2. Identifier: e.g. `pass.ge.sabagiro.ticket`
3. **Certificates** → **+** → **Pass Type ID Certificate** → select the Pass Type ID → create CSR in Keychain Access → download `.cer`
4. Export **`.p12`** from Keychain (certificate + private key) — remember password

## 2. WWDR certificate

Download **Apple WWDR Intermediate G4** (PEM) from Apple PKI page and save as PEM text.

## 3. Convert for Vercel env

From the `.p12` extract PEM cert + key (on Mac):

```bash
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem
openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem
# enter import password, then set export password (or empty)
```

Base64 for Vercel (optional — raw PEM with `\n` also works if pasted carefully):

```bash
base64 -i signerCert.pem | tr -d '\n'
```

## 4. Vercel environment variables

| Variable | Example |
|----------|---------|
| `APPLE_WALLET_PASS_TYPE_ID` | `pass.ge.sabagiro.ticket` |
| `APPLE_WALLET_TEAM_ID` | `ABCDE12345` (10 chars, Membership details) |
| `APPLE_WALLET_WWDR_CERT` | PEM or base64 WWDR G4 |
| `APPLE_WALLET_SIGNER_CERT` | PEM or base64 pass cert |
| `APPLE_WALLET_SIGNER_KEY` | PEM or base64 private key |
| `APPLE_WALLET_SIGNER_KEY_PASSPHRASE` | key export password (if any) |

**Redeploy** after adding.

## 5. Test

1. `/account` on **iPhone Safari** (Chrome iOS may not open Wallet)
2. Tap **Add to Apple Wallet**
3. Pass should show event name, holder, QR for door scan

API: `GET /api/tickets/{id}/wallet` → `.pkpass` file  
Status: `GET /api/wallet/status` → `{ appleWallet: true }`

---

## Notes

- QR on the pass uses the same scan URL as email/site (`/scan/{token}`)
- Google Wallet is **not** included yet (separate setup)
- Pass updates (void on cancel) can be added later with PassKit web service
