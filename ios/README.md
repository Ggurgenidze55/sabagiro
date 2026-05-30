# Sabagiro iOS app

Native shell around **https://www.sabagiro.ge** (WKWebView). Tickets, login, cart, **Flitt payment** — all inside the app (no Safari for checkout).

## Open in Xcode

```bash
cd ~/Desktop/sabagiro/ios
xcodegen generate   # only if you change project.yml
open Sabagiro.xcodeproj
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
