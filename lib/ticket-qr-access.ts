/** QR hidden from site / email image URL this many days after event date (end of day, Tbilisi). */
export const QR_RETENTION_DAYS_AFTER_EVENT = 7;

/** If ticket has no event date, hide QR this many days after purchase. */
export const QR_FALLBACK_RETENTION_DAYS = 90;

const TBILISI_OFFSET = '+04:00';

export type TicketQrContext = {
  eventDate?: string | null;
  createdAt?: Date;
  status: string;
};

function endOfEventDayMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(`${trimmed}T23:59:59.999${TBILISI_OFFSET}`);
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;

  const d = new Date(parsed);
  return Date.parse(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T23:59:59.999${TBILISI_OFFSET}`,
  );
}

export function getQrExpiryMs(ticket: TicketQrContext): number | null {
  if (ticket.status === 'CANCELLED') return 0;

  const eventEnd = ticket.eventDate ? endOfEventDayMs(ticket.eventDate) : null;
  if (eventEnd != null) {
    return eventEnd + QR_RETENTION_DAYS_AFTER_EVENT * 24 * 60 * 60 * 1000;
  }

  if (ticket.createdAt) {
    return ticket.createdAt.getTime() + QR_FALLBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  }

  return null;
}

export function isQrExpired(ticket: TicketQrContext, now = Date.now(), adminBypass = false): boolean {
  if (adminBypass) return false;
  const expiry = getQrExpiryMs(ticket);
  if (expiry == null) return false;
  return now > expiry;
}

export function canAccessTicketQr(ticket: TicketQrContext, adminBypass = false): boolean {
  if (ticket.status === 'CANCELLED') return false;
  return !isQrExpired(ticket, Date.now(), adminBypass);
}

export function qrExpiredMessage(): string {
  return 'This event has passed. QR code is no longer available.';
}

export function resolveEventDate(
  ticket: { eventDate: string | null; productSlug: string },
  eventDatesBySlug: Record<string, string | null | undefined>,
): string | null {
  if (ticket.eventDate?.trim()) return ticket.eventDate.trim();
  const fromEvent = eventDatesBySlug[ticket.productSlug];
  return fromEvent?.trim() ? fromEvent.trim() : null;
}

export function ticketQrContext(
  ticket: {
    eventDate: string | null;
    productSlug: string;
    createdAt: Date;
    status: string;
  },
  eventDatesBySlug: Record<string, string | null | undefined>,
): TicketQrContext {
  return {
    eventDate: resolveEventDate(ticket, eventDatesBySlug),
    createdAt: ticket.createdAt,
    status: ticket.status,
  };
}

export type TicketForQrContext = {
  eventDate: string | null;
  productSlug: string;
  createdAt: Date;
  status: string;
};

export async function loadTicketQrContext(
  ticket: TicketForQrContext,
  lookupEventDate: (slug: string) => Promise<string | null | undefined>,
): Promise<TicketQrContext> {
  if (ticket.eventDate?.trim()) {
    return ticketQrContext(ticket, {});
  }
  const fromEvent = await lookupEventDate(ticket.productSlug);
  return ticketQrContext(ticket, { [ticket.productSlug]: fromEvent });
}
