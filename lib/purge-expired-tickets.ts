import type { TicketStatus } from '@/generated/prisma/client';
import { addTbilisiDays, tbilisiDateKey } from '@/lib/artist-tickets';
import { prisma } from '@/lib/db';
import {
  endOfEventDayMs,
  TICKET_RETENTION_DAYS_AFTER_EVENT,
} from '@/lib/ticket-qr-access';

const PURGE_STATUSES: TicketStatus[] = ['VALID', 'USED'];
const BATCH_SIZE = 500;

function ticketPastRetention(
  ticket: { eventDate: string | null; productSlug: string },
  eventDatesBySlug: Map<string, string | null>,
  now: number,
): boolean {
  const eventDate =
    ticket.eventDate?.trim() || eventDatesBySlug.get(ticket.productSlug)?.trim() || null;
  if (!eventDate) return false;

  const eventEnd = endOfEventDayMs(eventDate);
  if (eventEnd == null) return false;

  const retentionMs = TICKET_RETENTION_DAYS_AFTER_EVENT * 24 * 60 * 60 * 1000;
  return now > eventEnd + retentionMs;
}

/** Delete VALID + USED tickets once event date + retention has passed (Tbilisi). */
export async function purgeExpiredTickets(now = Date.now()) {
  const prefilterCutoff = addTbilisiDays(
    tbilisiDateKey(new Date(now)),
    -(TICKET_RETENTION_DAYS_AFTER_EVENT + 1),
  );

  const eventDatesBySlug = new Map(
    (await prisma.clubEvent.findMany({ select: { slug: true, eventDate: true } })).map((e) => [
      e.slug,
      e.eventDate,
    ]),
  );

  let deleted = 0;
  let walletRegs = 0;
  let scanned = 0;
  let lastId: string | undefined;

  while (true) {
    const batch = await prisma.ticket.findMany({
      where: {
        status: { in: PURGE_STATUSES },
        OR: [{ eventDate: { lte: prefilterCutoff } }, { eventDate: null }],
        ...(lastId ? { id: { gt: lastId } } : {}),
      },
      select: { id: true, eventDate: true, productSlug: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    });

    if (!batch.length) break;

    scanned += batch.length;
    lastId = batch[batch.length - 1].id;

    const idsToDelete = batch
      .filter((t) => ticketPastRetention(t, eventDatesBySlug, now))
      .map((t) => t.id);

    if (idsToDelete.length) {
      const wr = await prisma.walletPassRegistration.deleteMany({
        where: { ticketId: { in: idsToDelete } },
      });
      walletRegs += wr.count;

      const td = await prisma.ticket.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      deleted += td.count;
    }

    if (batch.length < BATCH_SIZE) break;
  }

  return {
    deleted,
    walletRegs,
    scanned,
    retentionDays: TICKET_RETENTION_DAYS_AFTER_EVENT,
    prefilterCutoff,
  };
}
