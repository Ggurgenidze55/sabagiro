# Google Play — Sabagiro Android app

WebView shell for **https://www.sabagiro.ge** — tickets, login, cart, Flitt payments.

| | |
|--|--|
| **Package** | `ge.sabagiro.app` |
| **Privacy** | https://www.sabagiro.ge/privacy |
| **Demo login** | `appstore.review@sabagiro.ge` / `SabagiroReview2026!` |

---

## 1. Prerequisites

1. **Google Play Console** — https://play.google.com/console ($25 one-time developer fee)
2. **Release keystore** — `android/sabagiro-release.keystore` + `android/keystore.properties` (gitignored; already on your Mac if you built APK before)
3. **Android Studio** — for signed bundle build

---

## 2. Build signed App Bundle (.aab)

Google Play requires **AAB**, not APK.

### Option A — Terminal

```bash
cd ~/Desktop/sabagiro/android
chmod +x bundle-release.sh
./bundle-release.sh
```

Output: `~/Desktop/sabagiro-play.aab`

### Option B — Android Studio

1. Open `android/` folder
2. **Build → Generate Signed Bundle / APK**
3. **Android App Bundle** → Next
4. Keystore: `sabagiro-release.keystore`, alias `sabagiro`
5. **release** → Finish

File: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. Create app in Play Console

1. **Create app**
2. Name: **Sabagiro**
3. Default language: English (US) or Georgian
4. App / Game: **App**
5. Free

---

## 4. Store listing

| Field | Suggestion |
|-------|------------|
| **Short description** | Official Sabagiro app — events, tickets, QR entry. |
| **Full description** | Sabagiro underground club (Tbilisi). Browse events, buy tickets, manage your account and QR tickets at the door. |
| **App icon** | `android/app/src/main/res/mipmap-*` or export 512×512 PNG |
| **Screenshots** | Phone — reuse `ios/app-store-screenshots/` or capture on Android |
| **Feature graphic** | 1024×500 (club branding) |
| **Category** | Events or Entertainment |
| **Contact email** | info@sabagiro.ge |
| **Privacy policy URL** | https://www.sabagiro.ge/privacy |

---

## 5. App content (required forms)

- **Privacy policy** — URL above
- **Ads** — No
- **App access** — Yes, login required → demo credentials (see top)
- **Content rating** — questionnaire (likely Everyone / Teen)
- **Target audience** — 18+ (club / events)
- **Data safety** — Email, name, phone collected for tickets; not sold; encrypted in transit
- **News app** — No

---

## 6. Upload release

1. **Release → Production** (or **Internal testing** first)
2. **Create new release**
3. Upload `sabagiro-play.aab`
4. Release name: `1.0 (1)`
5. Release notes: e.g. *Initial release — events, tickets, account, in-app checkout.*
6. **Review release** → **Start rollout**

First review often takes **1–7 days**.

---

## 7. After approval

1. Copy Play Store URL from **Store presence → Main store listing**
2. Vercel env: `NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=ge.sabagiro.app`
3. Update homepage badge (replace “Coming soon” / APK-only copy)
4. Optional: keep APK at `/downloads/` for users without Play access

---

## Version bumps (next releases)

Edit `android/app/build.gradle.kts`:

- `versionCode` — integer, must increase every upload
- `versionName` — display string (e.g. `1.0.1`)

Then rebuild AAB and upload new release.

---

## Keystore backup

**Never lose** `sabagiro-release.keystore` and passwords — Google Play updates must use the same key. Keep a secure backup (1Password, external drive).
