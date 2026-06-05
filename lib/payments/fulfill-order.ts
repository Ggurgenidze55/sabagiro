import type { Order, OrderItem, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { createTicketForUser } from '@/lib/tickets';
import { getEventTierAvailability } from '@/lib/ticket-tiers';
import {
  countPurchasedTicketsForEvent,
  purchaseLimitApplies,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';
import type { StoredOrderHolder } from '@/lib/payments/types';

function parsePrices(item: OrderItem): number[] {
  const raw = item.unitPrices;
  if (!Array.isArray(raw)) throw new Error('INVALID_ORDER_ITEM');
  return raw.map((p) => Number(p));
}

function parseLabels(item: OrderItem): string[] {
  const raw = item.tierLabels;
  if (!Array.isArray(raw)) return [];
  return raw.map((l) => String(l));
}

function parseHolders(item: OrderItem): StoredOrderHolder[] {
  const raw = item.holders;
  if (!Array.isArray(raw)) return [];
  return raw as StoredOrderHolder[];
}

export async function fulfillPaidOrder(orderId: string): Promise<string[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.status === 'PAID') return [];

  const user = await prisma.user.findUniqueOrThrow({ where: { id: order.userId } });
  const ticketIds: string[] = [];

  await prisma.$transaction(async () => {
    const current = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    if (current.status === 'PAID') return;

    if (current.expiresAt && current.expiresAt < new Date()) {
      throw new Error('ORDER_EXPIRED');
    }

    for (const item of current.items) {
      if (purchaseLimitApplies(user)) {
        const remaining = await remainingPurchaseSlots(user, item.productSlug);
        if (item.quantity > remaining) {
          throw new Error(remaining <= 0 ? 'ALREADY_OWNED' : 'TICKET_LIMIT');
        }
      }

      const avail = await getEventTierAvailability(item.productSlug);
      if (!avail || avail.totalRemaining < item.quantity) {
        throw new Error('SOLD_OUT');
      }

      const prices = parsePrices(item);
      const labels = parseLabels(item);
      const extraHolders = parseHolders(item);
      const existingPurchased = await countPurchasedTicketsForEvent(user.id, item.productSlug);
      let holderIdx = 0;

      for (let i = 0; i < item.quantity; i++) {
        const usesBuyer = existingPurchased === 0 && i === 0;
        const holder = usesBuyer ? undefined : extraHolders[holderIdx++];
        if (!usesBuyer && !holder) throw new Error('HOLDER_REQUIRED');

        const { ticket } = await createTicketForUser({
          user,
          productSlug: item.productSlug,
          source: 'PURCHASE',
          priceGel: prices[i] ?? prices[prices.length - 1],
          tierLabel: labels[i] ?? '',
          createdByUserId: user.id,
          holder,
        });
        ticketIds.push(ticket.id);
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  });

  return ticketIds;
}

export async function markOrderFailed(orderId: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
}
