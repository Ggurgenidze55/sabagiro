import type { Role, User } from '@prisma/client';
import { prisma } from '@/lib/db';

export function purchaseLimitApplies(user: { role: Role }) {
  return user.role !== 'ADMIN';
}

export function getTicketLimitPerEvent(user: Pick<User, 'ticketLimitPerEvent' | 'role'>) {
  if (user.role === 'ADMIN') return 99;
  return Math.max(1, user.ticketLimitPerEvent);
}

export async function countPurchasedTicketsTotal(userId: string) {
  return prisma.ticket.count({
    where: {
      userId,
      status: { not: 'CANCELLED' },
      source: 'PURCHASE',
    },
  });
}

export async function remainingPurchaseSlots(
  user: Pick<User, 'id' | 'role' | 'ticketLimitPerEvent'>,
) {
  if (!purchaseLimitApplies(user)) return 99;
  const limit = getTicketLimitPerEvent(user);
  const owned = await countPurchasedTicketsTotal(user.id);
  return Math.max(0, limit - owned);
}

export async function listOwnedEventSlugs(userId: string) {
  const rows = await prisma.ticket.findMany({
    where: {
      userId,
      status: { not: 'CANCELLED' },
      source: 'PURCHASE',
    },
    select: { productSlug: true },
    distinct: ['productSlug'],
  });
  return rows.map((r) => r.productSlug);
}

export function ticketLimitMessage(limit: number) {
  return `სულ მაქსიმუმ ${limit} ბილეთის ყიდვა შეგიძლია ყველა ღონისძიებაზე ჯამურად.`;
}

export function ticketAlreadyOwnedMessage(limit: number) {
  if (limit <= 1) {
    return 'სულ 1 ბილეთის ყიდვის უფლება გაქვს — ლიმიტი ამოიწურა.';
  }
  return `სულ ${limit} ბილეთის ლიმიტი ამოიწურა (ყველა ღონისძიებაზე ჯამურად).`;
}

export function freeTicketsRemaining(user: Pick<User, 'freeTicketsEnabled' | 'freeTicketsQuota' | 'freeTicketsUsed'>) {
  if (!user.freeTicketsEnabled) return 0;
  return Math.max(0, user.freeTicketsQuota - user.freeTicketsUsed);
}
