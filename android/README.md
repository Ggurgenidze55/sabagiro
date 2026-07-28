# Sabagiro Android app

Native shell around **https://www.sabagiro.ge** (WebView). Tickets, login, cart, **Flitt payment** — same as the iOS app.

## Open in Android Studio

```bash
cd ~/Desktop/sabagiro/android
open -a "Android Studio" .
```

Or: **File → Open** → select the `android` folder.

First open: Gradle sync may take a few minutes (downloads SDK deps if needed).

## Run on phone or emulator

1. **Tools → Device Manager** → create/start an emulator, or connect an Android phone with USB debugging.
2. Select **app** run configuration.
3. Click **Run** (▶).

Debug builds allow `http://127.0.0.1:3001` and LAN IPs for local Next.js (`npm run dev` on port **3001**).  
Emulator: use `http://10.0.2.2:3001` instead of `127.0.0.1`.

Edit `AppConfig.kt` → `siteUrl` for local testing.

## Payments in the app

Checkout opens **pay.flitt.com** in the same WebView. After payment, Flitt returns to **sabagiro.ge/payment/return**.

Allowed in-app hosts: `sabagiro.ge`, `vercel.app`, `flitt.com`, plus bank 3DS pages while checkout is active.

## Google Wallet

Tapping **Add to Google Wallet** on `/account` fetches a signed save link and opens `pay.google.com` (handled in `SabagiroWebViewClient`). Requires server env vars — see `docs/GOOGLE-WALLET.md`.

## Splash

Yellow loader + Sabagiro logo on `#0a0a0a` background until the first page load completes (matches iOS shell).

## Release build (APK — website download)

```bash
npm run android:publish-apk
```

Or manually: `./gradlew assembleRelease` → copy APK to `public/downloads/`.

**Play Protect:** sideload installs show “App blocked” until the app is on Google Play. Steps: **https://www.sabagiro.ge/download/android**

## Google Play (.aab)

Full checklist: **`docs/GOOGLE-PLAY.md`**

```bash
cd ~/Desktop/sabagiro/android
chmod +x bundle-release.sh
./bundle-release.sh
```

Upload `~/Desktop/sabagiro-play.aab` in Play Console → **Production → Create release**.

Or **Android Studio → Build → Generate Signed Bundle / APK → Android App Bundle**.

Keep `sabagiro-release.keystore` and `keystore.properties` backed up — they are gitignored.
