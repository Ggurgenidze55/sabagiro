import { CartView } from '@/components/CartView';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  getTicketLimitPerEvent,
  listOwnedEventSlugs,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cart — Sabagiro',
};

export default async function CartPage() {
  const user = await getSessionUser();
  const ownedEventSlugs = user ? await listOwnedEventSlugs(user.id) : [];
  const purchaseLimitPerEvent = user ? getTicketLimitPerEvent(user) : 1;

  const purchasedRows = user
    ? await prisma.ticket.groupBy({
        by: ['productSlug'],
        where: {
          userId: user.id,
          source: 'PURCHASE',
          status: { not: 'CANCELLED' },
        },
        _count: { _all: true },
      })
    : [];

  const purchasedCountBySlug = Object.fromEntries(
    purchasedRows.map((row) => [row.productSlug, row._count._all]),
  ) as Record<string, number>;

  const remainingBySlug: Record<string, number> = {};
  if (user) {
    for (const slug of new Set([...ownedEventSlugs, ...Object.keys(purchasedCountBySlug)])) {
      remainingBySlug[slug] = await remainingPurchaseSlots(user, slug);
    }
  }

  return (
    <SiteChrome current="cart">
      <h1 className="page-title">CART</h1>
      <p className="page-lead">
        ყიდვის ლიმიტი: {purchaseLimitPerEvent} ბილეთი / ღონისძიება · Review before checkout
      </p>
      <CartView
        ownedEventSlugs={ownedEventSlugs}
        purchaseLimitPerEvent={purchaseLimitPerEvent}
        purchasedCountBySlug={purchasedCountBySlug}
        remainingBySlug={remainingBySlug}
      />
    </SiteChrome>
  );
}
