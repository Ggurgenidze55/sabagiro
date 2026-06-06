/** Direct APK download served from /public/downloads on sabagiro.ge */
export const APP_DOWNLOAD_ANDROID_APK = '/downloads/sabagiro-android.apk';

/** Set NEXT_PUBLIC_APP_STORE_URL when the iOS app is live on the App Store. */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || null;
