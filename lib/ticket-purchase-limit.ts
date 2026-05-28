import type { Role, User } from '@prisma/client';
import { prisma } from '@/lib/db';

export function purchaseLimitApplies(user: { role: Role }) {
  return user.role !== 'ADMIN';
}

export function getTicketLimitPerEvent(user: Pick<User, 'ticketLimitPerEvent' | 'role'>) {
  if (user.role === 'ADMIN') return 99;
  return Math.max(1, user.ticketLimitPerEvent);
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

export async function userOwnsTicketForEvent(
  user: Pick<User, 'id' | 'role' | 'ticketLimitPerEvent'>,
  eventSlug: string,
) {
  const remaining = await remainingPurchaseSlots(user, eventSlug);
  return remaining <= 0;
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
  return `ამ ღონისძიებაზე მაქსიმუმ ${limit} ბილეთის ყიდვა შეგიძლია.`;
}

export function ticketAlreadyOwnedMessage(limit: number) {
  if (limit <= 1) {
    return 'ამ ღონისძიების ბილეთი უკვე გაქვს — მეორეს ვერ იყიდი.';
  }
  return `ამ ღონისძიებაზე უკვე გაქვთ ${limit} ბილეთი — ლიმიტი ამოიწურა.`;
}

export function freeTicketsRemaining(user: Pick<User, 'freeTicketsEnabled' | 'freeTicketsQuota' | 'freeTicketsUsed'>) {
  if (!user.freeTicketsEnabled) return 0;
  return Math.max(0, user.freeTicketsQuota - user.freeTicketsUsed);
}
