import { prisma } from '@/lib/db';

export type EventPromoStatRow = {
  code: string;
  percentOff: number;
  active: boolean;
  ordersCount: number;
  ticketsSold: number;
  discountGel: number;
  revenueGel: number;
};

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
    bucket.revenueGel += Math.round(order.totalGel * ratio);
    salesByPromoId.set(order.promoCodeId, bucket);
  }

  const rows: EventPromoStatRow[] = promos.map((p) => {
    const sales = salesByPromoId.get(p.id);
    return {
      code: p.code,
      percentOff: p.percentOff,
      active: p.active,
      ordersCount: sales?.ordersCount ?? 0,
      ticketsSold: sales?.ticketsSold ?? 0,
      discountGel: sales?.discountGel ?? 0,
      revenueGel: sales?.revenueGel ?? 0,
    };
  });

  return rows.sort((a, b) => b.ticketsSold - a.ticketsSold || a.code.localeCompare(b.code));
}
