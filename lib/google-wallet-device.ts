/**
 * Google Wallet save links are for Android phones/tablets (not iOS or desktop).
 */
export function canUseGoogleWallet(userAgent: string): boolean {
  if (!userAgent) return false;

  if (/SabagiroApp\/[\d.]+\s+Android/i.test(userAgent)) return true;

  if (/Android/i.test(userAgent) && !/iPhone|iPad|iPod/i.test(userAgent)) return true;

  return false;
}

export function canUseGoogleWalletClient(): boolean {
  if (typeof navigator === 'undefined') return false;
  return canUseGoogleWallet(navigator.userAgent);
}
