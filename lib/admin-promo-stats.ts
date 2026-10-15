import { prisma } from '@/lib/db';

export type EventPromoStatRow = {
  code: string;
  percentOff: number;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  ordersCount: number;
  ticketsSold: number;
  discountGel: number;
  revenueGel: number;
};

function sumUnitPrices(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  return raw.reduce((s, p) => s + Number(p), 0);
}

/** Paid checkouts with a promo code for this event (includes codes with 0 sales). */
export async function getEventPromoStats(eventSlug: string): Promise<EventPromoStatRow[]> {
  const [promos, orders] = await Promise.all([
    prisma.promoCode.findMany({
      where: { eventSlug },
      orderBy: { code: 'asc' },
    }),
    prisma.order.findMany({
      where: {
        status: 'PAID',
        promoCodeId: { not: null },
        items: { some: { productSlug: eventSlug } },
      },
      include: { items: true },
    }),
  ]);

  const salesByPromoId = new Map<
    string,
    { ordersCount: number; ticketsSold: number; discountGel: number; revenueGel: number }
  >();

  for (const order of orders) {
    if (!order.promoCodeId) continue;
    const eventItems = order.items.filter((i) => i.productSlug === eventSlug);
    const ticketsSold = eventItems.reduce((s, i) => s + i.quantity, 0);
    if (ticketsSold === 0) continue;

    const eventRevenue = eventItems.reduce((s, i) => s + sumUnitPrices(i.unitPrices), 0);
    const orderTickets = order.items.reduce((s, i) => s + i.quantity, 0);
    const ratio = orderTickets > 0 ? ticketsSold / orderTickets : 1;

    const bucket = salesByPromoId.get(order.promoCodeId) ?? {
      ordersCount: 0,
      ticketsSold: 0,
      discountGel: 0,
      revenueGel: 0,
    };
    bucket.ordersCount += 1;
    bucket.ticketsSold += ticketsSold;
    bucket.discountGel += Math.round(order.discountGel * ratio);
    bucket.revenueGel += eventRevenue;
    salesByPromoId.set(order.promoCodeId, bucket);
  }

  const rows: EventPromoStatRow[] = promos.map((p) => {
    const sales = salesByPromoId.get(p.id);
    return {
      code: p.code,
      percentOff: p.percentOff,
      active: p.active,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      ordersCount: sales?.ordersCount ?? 0,
      ticketsSold: sales?.ticketsSold ?? 0,
      discountGel: sales?.discountGel ?? 0,
      revenueGel: sales?.revenueGel ?? 0,
    };
  });

  return rows.sort((a, b) => b.ticketsSold - a.ticketsSold || a.code.localeCompare(b.code));
}
