import { siteUrl } from '@/lib/site-url';

/** Public guest link for a ticket (works without login). */
export function ticketSharePath(qrToken: string) {
  return `/t/${encodeURIComponent(qrToken)}`;
}

export function ticketShareUrl(qrToken: string) {
  return siteUrl(ticketSharePath(qrToken));
}
