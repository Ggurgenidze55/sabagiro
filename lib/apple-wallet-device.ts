/**
 * Apple Wallet passes can only be added on iPhone / iPad (not Android, macOS, Windows).
 */
export function canUseAppleWallet(userAgent: string): boolean {
  if (!userAgent) return false;

  const ua = userAgent;

  if (/Android/i.test(ua)) return false;
  if (/SabagiroApp\/[\d.]+\s+Android/i.test(ua)) return false;

  if (/SabagiroApp\/[\d.]+\s+iOS/i.test(ua)) return true;

  if (/iPhone|iPod|iPad/i.test(ua)) return true;

  // iPadOS 13+ may report as Macintosh with a Mobile/ token.
  if (/Macintosh/i.test(ua) && /Mobile\//i.test(ua)) return true;

  return false;
}

/** Client-side check (navigator). */
export function canUseAppleWalletClient(): boolean {
  if (typeof navigator === 'undefined') return false;
  return canUseAppleWallet(navigator.userAgent);
}
