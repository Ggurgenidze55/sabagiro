import type { Prisma, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { allocateTierPrices, getEventTierAvailability } from '@/lib/ticket-tiers';
import {
  countPurchasedTicketsForEvent,
  purchaseLimitApplies,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';
import { extraHolderCount } from '@/lib/ticket-holders';
import {
  isProfileCompleteForTicket,
} from '@/lib/user-ticket-holder';
import { ORDER_TTL_MINUTES } from '@/lib/payments/config';
import type { CheckoutLineItem } from '@/lib/payments/types';

export async function createPendingOrder(user: User, items: CheckoutLineItem[]) {
  const lines: {
    productSlug: string;
    productName: string;
    quantity: number;
    unitPrices: number[];
    tierLabels: string[];
    holders: Prisma.InputJsonValue;
  }[] = [];

  let totalGel = 0;

  for (const item of items) {
    const product = await getProduct(item.slug);
    if (!product || product.type !== 'ticket') continue;
    if (product.isFreeEntry) throw new Error('FREE_ENTRY_ONLY');

    if (purchaseLimitApplies(user)) {
      const remaining = await remainingPurchaseSlots(user, item.slug);
      if (item.qty > remaining) {
        throw new Error(remaining <= 0 ? 'ALREADY_OWNED' : 'TICKET_LIMIT');
      }
    }

    const avail = await getEventTierAvailability(item.slug);
    if (!avail || avail.totalRemaining < item.qty) {
      throw new Error('SOLD_OUT');
    }

    const { prices, labels } = allocateTierPrices(avail.tiers, item.qty);
    const extraHolders = item.holders ?? [];
    const existingPurchased = await countPurchasedTicketsForEvent(user.id, item.slug);
    const requiredHolders = extraHolderCount(item.qty, existingPurchased);
    if (requiredHolders === 0 && item.qty > 0 && !isProfileCompleteForTicket(user)) {
      throw new Error('PROFILE_INCOMPLETE');
    }
    if (extraHolders.length < requiredHolders) {
      throw new Error('HOLDER_REQUIRED');
    }

    totalGel += prices.reduce((s, p) => s + p, 0);
    lines.push({
      productSlug: item.slug,
      productName: product.name,
      quantity: item.qty,
      unitPrices: prices,
      tierLabels: labels,
      holders: extraHolders as Prisma.InputJsonValue,
    });
  }

  if (lines.length === 0) {
    throw new Error('NO_ITEMS');
  }

  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60_000);

  return prisma.order.create({
    data: {
      userId: user.id,
      totalGel,
      expiresAt,
      items: {
        create: lines.map((line) => ({
          productSlug: line.productSlug,
          productName: line.productName,
          quantity: line.quantity,
          unitPrices: line.unitPrices,
          tierLabels: line.tierLabels,
          holders: line.holders,
        })),
      },
    },
    include: { items: true },
  });
}
