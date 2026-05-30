import { CartView } from '@/components/CartView';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { canPurchaseTickets } from '@/lib/verification';
import {
  countAllPurchasedByEvent,
  getTicketLimitPerEvent,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cart — Sabagiro',
};

export default async function CartPage() {
  const user = await getSessionUser();
  const purchaseLimitPerEvent = user ? getTicketLimitPerEvent(user) : 1;
  const purchasedCountBySlug = user ? await countAllPurchasedByEvent(user.id) : {};
  const remainingBySlug: Record<string, number> = {};
  if (user) {
    for (const slug of Object.keys(purchasedCountBySlug)) {
      remainingBySlug[slug] = await remainingPurchaseSlots(user, slug);
    }
  }
  const showLimitDetails = Boolean(user?.freeTicketsEnabled);

  const canCheckout = user && canPurchaseTickets(user);

  return (
    <SiteChrome current="cart">
      <h1 className="page-title">CART</h1>
      <p className="page-lead">
        {showLimitDetails
          ? `Purchase limit: ${purchaseLimitPerEvent} paid ticket(s) per event`
          : 'Review before checkout'}
      </p>
      <TicketAccessNotice user={user} />
      {canCheckout ? (
      <CartView
        purchaseLimitPerEvent={purchaseLimitPerEvent}
        purchasedCountBySlug={purchasedCountBySlug}
        remainingBySlug={remainingBySlug}
        showLimitDetails={showLimitDetails}
      />
      ) : null}
    </SiteChrome>
  );
}
