import { CartView } from '@/components/CartView';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import {
  countPurchasedTicketsTotal,
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
  const purchasedTotal = user ? await countPurchasedTicketsTotal(user.id) : 0;
  const remainingTotal = user ? await remainingPurchaseSlots(user) : purchaseLimitPerEvent;
  const showLimitDetails = Boolean(user?.freeTicketsEnabled);

  return (
    <SiteChrome current="cart">
      <h1 className="page-title">CART</h1>
      <p className="page-lead">
        {showLimitDetails
          ? `ყიდვის ლიმიტი: ${purchaseLimitPerEvent} ბილეთი ჯამურად · გამოყენებული: ${purchasedTotal}`
          : 'Review before checkout'}
      </p>
      <CartView
        purchaseLimitTotal={purchaseLimitPerEvent}
        purchasedTotal={purchasedTotal}
        remainingTotal={remainingTotal}
        showLimitDetails={showLimitDetails}
      />
    </SiteChrome>
  );
}
