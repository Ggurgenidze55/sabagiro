# Sabagiro iOS app

Native shell around **https://sabagiro.vercel.app** (WKWebView). Same site as the browser — tickets, login, shop.

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

## Local website in DEBUG

Edit `Sabagiro/AppConfig.swift` — point `siteURL` to `http://127.0.0.1:3001` and run `npm run dev` on your Mac.  
Use the Mac’s LAN IP on a real device (not `127.0.0.1`).

## Regenerate Xcode project

After editing `project.yml`:

```bash
cd ios && xcodegen generate
```
