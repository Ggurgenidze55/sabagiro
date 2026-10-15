import type { Prisma, TicketSource, TicketStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import type { EventPromoStatRow } from '@/lib/admin-promo-stats';
import { getEventPromoStats } from '@/lib/admin-promo-stats';
import {
  emptyKindStats,
  type AdminTicketStats,
  type TicketKindStats,
  ticketKind,
} from '@/lib/admin-ticket-stats';

export type EventStatisticsSnapshot = {
  eventSlug: string;
  eventTitle: string;
  eventDate: string | null;
  dayLabel: string;
  dateLabel: string;
  ticketStats: AdminTicketStats;
  inviteAdmin: number;
  inviteFree: number;
  inviteArtist: number;
  paidRevenueGel: number;
  promoTicketsSold: number;
  promoOrdersCount: number;
  promoDiscountGel: number;
  promoRevenueGel: number;
  promoBreakdown: EventPromoStatRow[];
};

export type EventStatisticsListRow = EventStatisticsSnapshot & {
  id: string | null;
  finalizedAt: Date | null;
  computedAt: Date | null;
  hasLiveTickets: boolean;
};

function applyCount(stats: TicketKindStats, status: TicketStatus, count: number) {
  stats.total += count;
  if (status === 'USED') stats.used += count;
  else if (status === 'VALID') stats.unused += count;
  else if (status === 'CANCELLED') stats.cancelled += count;
}

function statsFromGrouped(
  rows: { source: TicketSource; status: TicketStatus; _count: { _all: number } }[],
): { ticketStats: AdminTicketStats; inviteAdmin: number; inviteFree: number; inviteArtist: number } {
  const paid = emptyKindStats();
  const invite = emptyKindStats();
  const combined = emptyKindStats();
  let inviteAdmin = 0;
  let inviteFree = 0;
  let inviteArtist = 0;

  for (const row of rows) {
    const count = row._count._all;
    if (row.source === 'ADMIN') inviteAdmin += count;
    else if (row.source === 'FREE') inviteFree += count;
    else if (row.source === 'ARTIST') inviteArtist += count;

    const bucket = ticketKind(row.source) === 'paid' ? paid : invite;
    applyCount(bucket, row.status, count);
    applyCount(combined, row.status, count);
  }

  return {
    ticketStats: { paid, invite, combined },
    inviteAdmin,
    inviteFree,
    inviteArtist,
  };
}

async function resolveEventMeta(eventSlug: string) {
  const event = await prisma.clubEvent.findFirst({
    where: { slug: eventSlug },
    select: { title: true, eventDate: true, dayLabel: true, dateLabel: true },
  });
  if (event) {
    return {
      eventTitle: event.title,
      eventDate: event.eventDate,
      dayLabel: event.dayLabel,
      dateLabel: event.dateLabel,
    };
  }

  const saved = await prisma.eventStatistics.findUnique({
    where: { eventSlug },
    select: { eventTitle: true, eventDate: true, dayLabel: true, dateLabel: true },
  });
  if (saved) {
    return {
      eventTitle: saved.eventTitle,
      eventDate: saved.eventDate,
      dayLabel: saved.dayLabel,
      dateLabel: saved.dateLabel,
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { productSlug: eventSlug },
    select: { productName: true, eventDate: true },
    orderBy: { createdAt: 'desc' },
  });
  return {
    eventTitle: ticket?.productName ?? eventSlug,
    eventDate: ticket?.eventDate ?? null,
    dayLabel: '',
    dateLabel: '',
  };
}

/** Live numbers from tickets + orders still in DB. */
export async function computeLiveEventStatistics(eventSlug: string): Promise<EventStatisticsSnapshot> {
  const [grouped, revenueRow, promoRows, meta] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['source', 'status'],
      where: { productSlug: eventSlug },
      _count: { _all: true },
    }),
    prisma.ticket.aggregate({
      where: { productSlug: eventSlug, source: 'PURCHASE', status: { not: 'CANCELLED' } },
      _sum: { priceGel: true },
    }),
    getEventPromoStats(eventSlug),
    resolveEventMeta(eventSlug),
  ]);

  const { ticketStats, inviteAdmin, inviteFree, inviteArtist } = statsFromGrouped(grouped);
  const promoTicketsSold = promoRows.reduce((s, r) => s + r.ticketsSold, 0);
  const promoOrdersCount = promoRows.reduce((s, r) => s + r.ordersCount, 0);
  const promoDiscountGel = promoRows.reduce((s, r) => s + r.discountGel, 0);
  const promoRevenueGel = promoRows.reduce((s, r) => s + r.revenueGel, 0);

  return {
    eventSlug,
    ...meta,
    ticketStats,
    inviteAdmin,
    inviteFree,
    inviteArtist,
    paidRevenueGel: revenueRow._sum.priceGel ?? 0,
    promoTicketsSold,
    promoOrdersCount,
    promoDiscountGel,
    promoRevenueGel,
    promoBreakdown: promoRows,
  };
}

function snapshotToAdminStats(row: {
  paidTotal: number;
  paidUsed: number;
  paidUnused: number;
  paidCancelled: number;
  inviteTotal: number;
  inviteUsed: number;
  inviteUnused: number;
  inviteCancelled: number;
  inviteAdmin: number;
  inviteFree: number;
  inviteArtist: number;
  paidRevenueGel: number;
  promoTicketsSold: number;
  promoOrdersCount: number;
  promoDiscountGel: number;
  promoRevenueGel: number;
  promoBreakdown: unknown;
  eventSlug: string;
  eventTitle: string;
  eventDate: string | null;
  dayLabel: string;
  dateLabel: string;
}): EventStatisticsSnapshot {
  const promoBreakdown = Array.isArray(row.promoBreakdown)
    ? (row.promoBreakdown as EventPromoStatRow[])
    : [];

  return {
    eventSlug: row.eventSlug,
    eventTitle: row.eventTitle,
    eventDate: row.eventDate,
    dayLabel: row.dayLabel,
    dateLabel: row.dateLabel,
    ticketStats: {
      paid: {
        total: row.paidTotal,
        used: row.paidUsed,
        unused: row.paidUnused,
        cancelled: row.paidCancelled,
      },
      invite: {
        total: row.inviteTotal,
        used: row.inviteUsed,
        unused: row.inviteUnused,
        cancelled: row.inviteCancelled,
      },
      combined: {
        total: row.paidTotal + row.inviteTotal,
        used: row.paidUsed + row.inviteUsed,
        unused: row.paidUnused + row.inviteUnused,
        cancelled: row.paidCancelled + row.inviteCancelled,
      },
    },
    inviteAdmin: row.inviteAdmin,
    inviteFree: row.inviteFree,
    inviteArtist: row.inviteArtist,
    paidRevenueGel: row.paidRevenueGel,
    promoTicketsSold: row.promoTicketsSold,
    promoOrdersCount: row.promoOrdersCount,
    promoDiscountGel: row.promoDiscountGel,
    promoRevenueGel: row.promoRevenueGel,
    promoBreakdown,
  };
}

export async function upsertEventStatistics(
  eventSlug: string,
  opts?: { finalize?: boolean },
): Promise<void> {
  const live = await computeLiveEventStatistics(eventSlug);
  const promoJson = live.promoBreakdown as unknown as Prisma.InputJsonValue;

  await prisma.eventStatistics.upsert({
    where: { eventSlug },
    create: {
      eventSlug: live.eventSlug,
      eventTitle: live.eventTitle,
      eventDate: live.eventDate,
      dayLabel: live.dayLabel,
      dateLabel: live.dateLabel,
      paidTotal: live.ticketStats.paid.total,
      paidUsed: live.ticketStats.paid.used,
      paidUnused: live.ticketStats.paid.unused,
      paidCancelled: live.ticketStats.paid.cancelled,
      inviteTotal: live.ticketStats.invite.total,
      inviteUsed: live.ticketStats.invite.used,
      inviteUnused: live.ticketStats.invite.unused,
      inviteCancelled: live.ticketStats.invite.cancelled,
      inviteAdmin: live.inviteAdmin,
      inviteFree: live.inviteFree,
      inviteArtist: live.inviteArtist,
      paidRevenueGel: live.paidRevenueGel,
      promoTicketsSold: live.promoTicketsSold,
      promoOrdersCount: live.promoOrdersCount,
      promoDiscountGel: live.promoDiscountGel,
      promoRevenueGel: live.promoRevenueGel,
      promoBreakdown: promoJson,
      finalizedAt: opts?.finalize ? new Date() : null,
    },
    update: {
      eventTitle: live.eventTitle,
      eventDate: live.eventDate,
      dayLabel: live.dayLabel,
      dateLabel: live.dateLabel,
      paidTotal: live.ticketStats.paid.total,
      paidUsed: live.ticketStats.paid.used,
      paidUnused: live.ticketStats.paid.unused,
      paidCancelled: live.ticketStats.paid.cancelled,
      inviteTotal: live.ticketStats.invite.total,
      inviteUsed: live.ticketStats.invite.used,
      inviteUnused: live.ticketStats.invite.unused,
      inviteCancelled: live.ticketStats.invite.cancelled,
      inviteAdmin: live.inviteAdmin,
      inviteFree: live.inviteFree,
      inviteArtist: live.inviteArtist,
      paidRevenueGel: live.paidRevenueGel,
      promoTicketsSold: live.promoTicketsSold,
      promoOrdersCount: live.promoOrdersCount,
      promoDiscountGel: live.promoDiscountGel,
      promoRevenueGel: live.promoRevenueGel,
      promoBreakdown: promoJson,
      ...(opts?.finalize ? { finalizedAt: new Date() } : {}),
    },
  });
}

/** Refresh saved rows for every slug that still has tickets (keeps archive current before purge). */
export async function refreshActiveEventStatisticsSnapshots(): Promise<number> {
  const slugs = await prisma.ticket.groupBy({
    by: ['productSlug'],
    _count: { _all: true },
  });
  for (const row of slugs) {
    await upsertEventStatistics(row.productSlug);
  }
  return slugs.length;
}

export async function snapshotStatisticsForSlugs(slugs: string[], finalize: boolean): Promise<void> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  for (const slug of unique) {
    await upsertEventStatistics(slug, { finalize });
  }
}

function eventDateSortKey(iso: string | null | undefined): string {
  return iso?.trim() || '0000-00-00';
}

export async function listEventStatisticsForAdmin(): Promise<EventStatisticsListRow[]> {
  const [savedRows, liveSlugs] = await Promise.all([
    prisma.eventStatistics.findMany({ orderBy: { eventDate: 'desc' } }),
    prisma.ticket.groupBy({ by: ['productSlug'] }),
  ]);

  const liveSet = new Set(liveSlugs.map((r) => r.productSlug));
  const bySlug = new Map<string, EventStatisticsListRow>();

  for (const row of savedRows) {
    bySlug.set(row.eventSlug, {
      ...snapshotToAdminStats(row),
      id: row.id,
      finalizedAt: row.finalizedAt,
      computedAt: row.computedAt,
      hasLiveTickets: liveSet.has(row.eventSlug),
    });
  }

  for (const slug of liveSet) {
    if (bySlug.has(slug)) continue;
    const live = await computeLiveEventStatistics(slug);
    bySlug.set(slug, {
      ...live,
      id: null,
      finalizedAt: null,
      computedAt: null,
      hasLiveTickets: true,
    });
  }

  return [...bySlug.values()].sort(
    (a, b) =>
      eventDateSortKey(b.eventDate).localeCompare(eventDateSortKey(a.eventDate)) ||
      a.eventTitle.localeCompare(b.eventTitle),
  );
}

export async function getEventStatisticsDetail(
  eventSlug: string,
): Promise<{ snapshot: EventStatisticsSnapshot; id: string | null; finalizedAt: Date | null; hasLiveTickets: boolean }> {
  const liveCount = await prisma.ticket.count({ where: { productSlug: eventSlug } });
  const saved = await prisma.eventStatistics.findUnique({ where: { eventSlug } });

  if (liveCount > 0) {
    const live = await computeLiveEventStatistics(eventSlug);
    return {
      snapshot: live,
      id: saved?.id ?? null,
      finalizedAt: saved?.finalizedAt ?? null,
      hasLiveTickets: true,
    };
  }

  if (saved) {
    return {
      snapshot: snapshotToAdminStats(saved),
      id: saved.id,
      finalizedAt: saved.finalizedAt,
      hasLiveTickets: false,
    };
  }

  const live = await computeLiveEventStatistics(eventSlug);
  return { snapshot: live, id: null, finalizedAt: null, hasLiveTickets: false };
}
