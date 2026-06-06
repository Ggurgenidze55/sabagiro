/** Appended to WebView user agents in ios/ and android/ shells. */
export const SABAGIRO_APP_UA_TOKEN = 'SabagiroApp';

export function isSabagiroAppUserAgent(userAgent: string): boolean {
  return userAgent.includes(SABAGIRO_APP_UA_TOKEN);
}

/** Detect Sabagiro iOS/Android shell in the browser. */
export function isSabagiroAppShell(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isSabagiroAppUserAgent(navigator.userAgent);
}
