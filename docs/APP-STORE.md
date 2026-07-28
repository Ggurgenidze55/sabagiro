# App Store — review & resubmission

Sabagiro iOS is a **WebView shell** around https://www.sabagiro.ge. Most App Review fixes ship on the **website** (Vercel); you only need a new iOS build when native code changes.

## Rejection 1.0 (2) — June 2026

| Guideline | Issue | Fix |
|-----------|-------|-----|
| **5.1.2(i)** Tracking / ATT | Privacy labels say data is used **for tracking**, but the app does not show App Tracking Transparency | Update **App Privacy** in App Store Connect (see below). Native app does **not** load Meta Pixel or GA4. |
| **5.1.1(v)** Account deletion | Registration without in-app delete | **Account → Settings → Delete account** (`/account/settings`) |

## Before resubmitting

### 1. Deploy website

```bash
npx vercel --prod --yes
```

Confirm on a phone with the TestFlight build:

- Settings shows **Delete account** at the bottom
- No Facebook / Google analytics requests in WebView (Safari Web Inspector → Network)

### 2. Update App Privacy (App Store Connect)

**App Store Connect → App → App Privacy → Edit**

For **Name, Email, Phone, Purchase History**:

- Purpose: **App Functionality** (account, tickets, checkout) — **not** “Tracking”
- Do **not** check “Data Used to Track You” unless you implement ATT and cross-app ad tracking inside the app

Apple defines **tracking** as linking app data with third-party data for advertising, or sharing with data brokers. Sabagiro collects registration/checkout data for tickets only. **Meta Pixel runs on the public website in Safari**, not inside the native app shell.

Optional: add **Analytics** for GA4 on web only — still not “tracking” if you do not use it for cross-app ads.

### 3. Review Notes (English)

Paste into **App Review Information → Notes**:

```
Demo account: appstore.review@sabagiro.ge / SabagiroReview2026!

Account deletion: Log in → Account (menu) → Settings → scroll to "Delete account" → DELETE MY ACCOUNT → type DELETE + password → Confirm.

Tracking: The native app loads our website in a WebView but does not load Meta Pixel, GA4, or other cross-app advertising SDKs. App Privacy has been updated — collected data is for app functionality (tickets/checkout), not tracking. No ATT prompt is required.

Screen recording of account deletion is attached in Review Information.
```

### 4. Screen recording (required)

On a **physical iPhone or iPad**, record:

1. Register a new account **or** sign in with the demo account
2. Open **Account → Settings**
3. Scroll to **Delete account** → **DELETE MY ACCOUNT**
4. Type `DELETE`, enter password, **Confirm delete**
5. Show redirect / logged-out state

Upload the video in **App Review Information** (Notes or attachment field).

### 5. Resubmit

- Same build **5** is OK if only the website changed
- Reply in App Store Connect to the rejection thread summarizing both fixes
- Submit for review again

## Facebook / Instagram ads (web)

- **Website (Safari):** Meta Pixel via `NEXT_PUBLIC_META_PIXEL_ID` — use for Facebook/Instagram campaigns pointing to sabagiro.ge
- **Native app (TestFlight / App Store):** Pixel and GA4 are **disabled** when User-Agent contains `SabagiroApp` (see `lib/app-shell.ts`, `components/SiteAnalytics.tsx`)

Campaigns should land on **https://www.sabagiro.ge** in the browser, not inside the app, for full ad attribution.

## Demo account

```bash
npm run seed:appstore-review
```

| Field | Value |
|-------|-------|
| Email | `appstore.review@sabagiro.ge` |
| Password | `SabagiroReview2026!` |

Re-run seed if the review account was deleted during testing.

## iOS Build 7 — Wallet fix (version 1.0.1)

Version **1.0** is already live on the App Store — new uploads need **1.0.1** (or higher). Build **7** includes the Wallet WKWebView fix.

```bash
cd ios && xcodegen generate && ./archive.sh
```

Xcode → **Organizer** → **Distribute App** → App Store Connect.

App Store Connect → **+ Version** → **1.0.1** → select **Build 7** → **Submit for Review**.

Review notes:

```
Wallet: Add to Apple Wallet uses the same /wallet URL as Safari (WKWebView navigation with login cookies).
Website updates (invitations, account deletion) load from sabagiro.ge — no extra native changes required.
Demo: appstore.review@sabagiro.ge / SabagiroReview2026!
Account deletion: Account → Settings → Delete account.
```
