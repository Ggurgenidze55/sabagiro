import type { EventTicketTier } from '@prisma/client';
import { prisma } from '@/lib/db';

const ACTIVE_TICKET_STATUSES = ['VALID', 'USED'] as const;

export type TierAvailability = {
  id: string;
  label: string;
  priceGel: number;
  quantity: number;
  sold: number;
  remaining: number;
};

export async function countSoldTicketsForEvent(eventSlug: string) {
  return prisma.ticket.count({
    where: {
      productSlug: eventSlug,
      status: { in: [...ACTIVE_TICKET_STATUSES] },
    },
  });
}

export function buildTierAvailability(tiers: EventTicketTier[], soldTotal: number): TierAvailability[] {
  let cursor = 0;
  return tiers.map((tier) => {
    const tierStart = cursor;
    const tierEnd = cursor + tier.quantity;
    cursor = tierEnd;

    const soldInTier = Math.min(tier.quantity, Math.max(0, soldTotal - tierStart));
    const remaining = Math.max(0, tier.quantity - soldInTier);

    return {
      id: tier.id,
      label: tier.label || `Tier ${tier.sortOrder + 1}`,
      priceGel: tier.priceGel,
      quantity: tier.quantity,
      sold: soldInTier,
      remaining,
    };
  });
}

export async function getEventTierAvailability(eventSlug: string) {
  const event = await prisma.clubEvent.findUnique({
    where: { slug: eventSlug },
    include: { ticketTiers: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!event) return null;

  const soldTotal = await countSoldTicketsForEvent(eventSlug);
  const tiers =
    event.ticketTiers.length > 0
      ? buildTierAvailability(event.ticketTiers, soldTotal)
      : [
          {
            id: 'default',
            label: 'Standard',
            priceGel: event.priceGel,
            quantity: 9999,
            sold: soldTotal,
            remaining: Math.max(0, 9999 - soldTotal),
          },
        ];

  const totalRemaining = tiers.reduce((sum, t) => sum + t.remaining, 0);
  const currentTier = tiers.find((t) => t.remaining > 0) ?? null;

  return {
    event,
    tiers,
    soldTotal,
    totalRemaining,
    currentTierPrice: currentTier?.priceGel ?? event.priceGel,
  };
}

/** Prices (₾) for each ticket in order, consuming tier capacity. */
export function allocateTierPrices(
  tiers: TierAvailability[],
  qty: number,
): { prices: number[]; labels: string[] } {
  const prices: number[] = [];
  const labels: string[] = [];
  const working = tiers.map((t) => ({ ...t }));

  for (let i = 0; i < qty; i++) {
    const tier = working.find((t) => t.remaining > 0);
    if (!tier) throw new Error('SOLD_OUT');
    prices.push(tier.priceGel);
    labels.push(tier.label);
    tier.remaining -= 1;
    tier.sold += 1;
  }

  return { prices, labels };
}
