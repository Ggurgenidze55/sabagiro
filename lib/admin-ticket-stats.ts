import type { TicketSource, TicketStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

/** Paid sales vs free invitations (ADMIN / FREE / ARTIST comps). */
export function ticketKind(source: TicketSource): 'paid' | 'invite' {
  return source === 'PURCHASE' ? 'paid' : 'invite';
}

export type TicketKindStats = {
  total: number;
  used: number;
  unused: number;
  cancelled: number;
};

export type AdminTicketStats = {
  paid: TicketKindStats;
  invite: TicketKindStats;
  combined: TicketKindStats;
};

function emptyKindStats(): TicketKindStats {
  return { total: 0, used: 0, unused: 0, cancelled: 0 };
}

function applyCount(stats: TicketKindStats, status: TicketStatus, count: number) {
  stats.total += count;
  if (status === 'USED') stats.used += count;
  else if (status === 'VALID') stats.unused += count;
  else if (status === 'CANCELLED') stats.cancelled += count;
}

export async function getAdminTicketStats(): Promise<AdminTicketStats> {
  const rows = await prisma.ticket.groupBy({
    by: ['source', 'status'],
    _count: { _all: true },
  });

  const paid = emptyKindStats();
  const invite = emptyKindStats();
  const combined = emptyKindStats();

  for (const row of rows) {
    const count = row._count._all;
    const bucket = ticketKind(row.source) === 'paid' ? paid : invite;
    applyCount(bucket, row.status, count);
    applyCount(combined, row.status, count);
  }

  return { paid, invite, combined };
}
