# Sabagiro iOS app

Native shell around **https://www.sabagiro.ge** (WKWebView). Tickets, login, cart, **Flitt payment** — all inside the app (no Safari for checkout).

## Open in Xcode

```bash
npm run ios:open
# or:
cd ~/Desktop/sabagiro/ios
./open-xcode.sh
```

**Do not** run `open -a Xcode` from the repo root — that opens an empty Xcode window without the Sabagiro project.

After editing `project.yml`: `cd ios && xcodegen generate`

**Do not put `.pkpass` or `.cer` files inside `sabagiro/`** — macOS/Xcode tries to preview them and crashes (`WalletSupportUI`). Keep certs and sample passes only in `~/Desktop/sabagiro-wallet-certs` (outside the repo).

### Xcode crashes on open (IDEIntelligenceChat)

If the crash log mentions `IDEIntelligenceChat` / `ChatModelService`, Apple Intelligence is unavailable on your Mac (often **system language en** vs **Siri en-GB**). Run:

```bash
cd ~/Desktop/sabagiro/ios
chmod +x fix-xcode-crash.sh
./fix-xcode-crash.sh
./open-xcode.sh
```

Optional: **System Settings → Siri → Language** — match your Mac language (e.g. English US).

### Archive fails: “No signing certificate”

If `security find-identity -p codesigning` shows **0 valid identities**, log in once in Xcode:

1. `./fix-xcode-crash.sh` then `./open-xcode.sh`
2. **Xcode → Settings → Accounts** → add `info@sabagiro.ge` (Team **R85UAY2KY6**)
3. **Manage Certificates…** → **+** → **Apple Distribution**
4. **Product → Archive** (or `./archive.sh`)

### Archive without Xcode UI

If Xcode keeps crashing, **build from Terminal** (no Xcode UI):

```bash
cd ~/Desktop/sabagiro/ios
chmod +x archive.sh
./archive.sh
```

Then upload: **Xcode → Window → Organizer → Archives → Distribute App**.

To open the project UI anyway:

```bash
chmod +x open-xcode.sh
./open-xcode.sh
```

## App Store update (new build)

1. **App Store Connect** → Sabagiro → **1.0 Waiting for Review** → **Remove from Review**
2. **Xcode → Settings → Accounts** → `info@sabagiro.ge` (Team **R85UAY2KY6**) → **Manage Certificates…** → **+** → **Apple Distribution** (required for upload)
3. Terminal:
   ```bash
   cd ~/Desktop/sabagiro/ios
   ./archive.sh
   ```
4. **Xcode → Window → Organizer → Archives** → **Sabagiro** (version **1.0.1**, build **7**) → **Distribute App** → **App Store Connect** → Upload
5. App Store Connect → **+ Version** → **1.0.1** → select build **7** → **Add for Review** → **Submit to App Review**

Review login (production): run `npm run seed:appstore-review` and paste credentials into **App Review Information**.

## API / backend

The app is a **WebView shell** — no separate mobile API. Everything goes through **https://www.sabagiro.ge** (`Sabagiro/AppConfig.swift`):

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/*` | Login, session cookie in WKWebView |
| `/api/tickets/[id]/wallet` | Apple Wallet `.pkpass` download |
| `/api/wallet/passkit/v1/*` | PassKit push updates after door scan |

## Apple Wallet in the app (Build 6+)

Tapping **Add to Apple Wallet** on `/account` loads `/api/tickets/.../wallet` **inside WKWebView** (same cookies + UA as the rest of the site — matches Safari). Rebuild after wallet Swift changes.

Archive:

```bash
cd ~/Desktop/sabagiro/ios && ./archive.sh
```

## Run on your iPhone

1. Connect iPhone with USB (or Wi‑Fi debugging).
2. On iPhone: **Trust** this Mac.
3. In Xcode: target **Sabagiro** → **Signing & Capabilities** → Team: your Apple ID (Personal Team).
4. Top bar: select your **iPhone** (not Simulator).
5. **Product → Run** (▶) or `Cmd + R`.

First time: iPhone → **Settings → General → VPN & Device Management** → trust the developer app.

## Payments in the app

Checkout opens **pay.flitt.com** in the same WebView (not external Safari). After payment, Flitt returns to **sabagiro.ge/payment/return** → account.

Allowed hosts: `sabagiro.ge`, `vercel.app`, `flitt.com`, plus bank 3DS pages while checkout is active.

## Local website in DEBUG

Edit `Sabagiro/AppConfig.swift` — point `siteURL` to `http://127.0.0.1:3001` and run `npm run dev` on your Mac.  
Use the Mac’s LAN IP on a real device (not `127.0.0.1`).

## Regenerate Xcode project

After editing `project.yml`:

```bash
cd ios && xcodegen generate
```
