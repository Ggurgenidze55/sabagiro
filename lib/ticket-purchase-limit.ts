import type { Role, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

export function purchaseLimitApplies(user: { role: Role }) {
  return user.role !== 'ADMIN';
}

export function getTicketLimitPerEvent(user: Pick<User, 'ticketLimitPerEvent' | 'role'>) {
  if (user.role === 'ADMIN') return 99;
  return Math.max(0, user.ticketLimitPerEvent);
}

export async function countPurchasedTicketsForEvent(userId: string, eventSlug: string) {
  return prisma.ticket.count({
    where: {
      userId,
      productSlug: eventSlug,
      status: { not: 'CANCELLED' },
      source: 'PURCHASE',
    },
  });
}

export async function remainingPurchaseSlots(
  user: Pick<User, 'id' | 'role' | 'ticketLimitPerEvent'>,
  eventSlug: string,
) {
  if (!purchaseLimitApplies(user)) return 99;
  const limit = getTicketLimitPerEvent(user);
  const owned = await countPurchasedTicketsForEvent(user.id, eventSlug);
  return Math.max(0, limit - owned);
}

export async function countAllPurchasedByEvent(userId: string) {
  const rows = await prisma.ticket.groupBy({
    by: ['productSlug'],
    where: {
      userId,
      status: { not: 'CANCELLED' },
      source: 'PURCHASE',
    },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.productSlug, row._count._all])) as Record<
    string,
    number
  >;
}

export function ticketLimitMessage(limit: number) {
  return `You can buy up to ${limit} paid ticket(s) for this event.`;
}

export function ticketAlreadyOwnedMessage(limit: number) {
  if (limit <= 0) {
    return 'Paid ticket purchase is currently disabled for this event.';
  }
  if (limit <= 1) {
    return 'You have already reached the 1 paid-ticket limit for this event.';
  }
  return `You have already reached the ${limit} paid-ticket limit for this event.`;
}

export function freeTicketsRemaining(user: Pick<User, 'freeTicketsEnabled' | 'freeTicketsQuota' | 'freeTicketsUsed'>) {
  if (!user.freeTicketsEnabled) return 0;
  return Math.max(0, user.freeTicketsQuota - user.freeTicketsUsed);
}

export async function countFreeTicketsForEvent(userId: string, eventSlug: string) {
  return prisma.ticket.count({
    where: {
      userId,
      productSlug: eventSlug,
      status: { not: 'CANCELLED' },
      source: 'FREE',
    },
  });
}

export async function remainingFreeTicketsForEvent(
  user: Pick<User, 'id' | 'role' | 'freeTicketsEnabled' | 'freeTicketsQuota'>,
  eventSlug: string,
) {
  if (user.role === 'ADMIN') return 99;
  if (!user.freeTicketsEnabled) return 0;
  const used = await countFreeTicketsForEvent(user.id, eventSlug);
  return Math.max(0, user.freeTicketsQuota - used);
}
