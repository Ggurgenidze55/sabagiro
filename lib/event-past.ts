import { endOfEventDayMs } from '@/lib/ticket-qr-access';

/** True after the event day ends (Tbilisi). */
export function isPastEventDate(eventDate: string | null | undefined): boolean {
  if (!eventDate?.trim()) return false;
  const endMs = endOfEventDayMs(eventDate);
  if (endMs == null) return false;
  return Date.now() > endMs;
}
