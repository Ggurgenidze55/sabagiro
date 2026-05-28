import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
import { EventTierList } from '@/components/EventTierList';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import {
  getTicketLimitPerEvent,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';
import { canPurchaseTickets } from '@/lib/verification';
import { normalizeEventSlug } from '@/lib/events';
import { formatGel, getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Not found — Sabagiro' };
  return { title: `${product.name} — Sabagiro Shop` };
}

export default async function ProductPage({ params }: PageProps) {
  const user = await getSessionUser();
  const decoded = decodeURIComponent(params.slug);
  const canonical = normalizeEventSlug(decoded);
  if (decoded !== canonical) {
    const legacy = await getProduct(decoded);
    if (legacy) redirect(`/shop/${canonical}`);
  }

  const product = await getProduct(params.slug);
  if (!product) notFound();

  const purchaseLimit = user ? getTicketLimitPerEvent(user) : 1;
  const purchaseRemaining =
    user && product.type === 'ticket'
      ? await remainingPurchaseSlots(user, product.slug)
      : purchaseLimit;
  const cannotBuyMore = Boolean(
    user && product.type === 'ticket' && purchaseRemaining <= 0,
  );
  const showLimitDetails = Boolean(user?.freeTicketsEnabled);

  return (
    <SiteChrome current="shop">
      <p className="page-lead">{product.tag ?? product.type.toUpperCase()}</p>
      <h1 className="page-title" style={{ color: product.accent }}>
        {product.name}
      </h1>
      <p className="page-lead" style={{ opacity: 0.75, maxWidth: '42rem', lineHeight: 1.8 }}>
        {product.description}
      </p>
      <p className="cart-total" style={{ margin: '1.5rem 0' }}>
        Current price {formatGel(product.priceGel)}
      </p>

      {product.type === 'ticket' ? (
        <EventTierList tiers={product.tiers} ticketsRemaining={product.ticketsRemaining} />
      ) : null}

      {product.type === 'ticket' && user && !canPurchaseTickets(user) ? (
        <p className="notice-banner notice-banner--inline">
          Ticket purchase requires a verified account. Status: {user.verificationStatus}. Check your
          account page after admin review.
        </p>
      ) : null}

      {product.type === 'ticket' && user && canPurchaseTickets(user) && cannotBuyMore && showLimitDetails ? (
        <p className="notice-banner notice-banner--inline">
          Purchase limit reached for this event ({purchaseLimit}).
          <Link href="/account" className="btn btn--ghost" style={{ marginTop: '0.75rem' }}>
            My tickets
          </Link>
        </p>
      ) : null}

      {product.type === 'ticket' && user && canPurchaseTickets(user) && !cannotBuyMore && purchaseLimit > 1 && showLimitDetails ? (
        <p className="page-lead" style={{ marginBottom: '1rem' }}>
          You can buy {purchaseRemaining} more ticket(s) for this event (limit {purchaseLimit}).
        </p>
      ) : null}

      {product.type === 'ticket' && product.ticketsRemaining === 0 ? (
        <p className="form-error">Sold out</p>
      ) : (
        <AddToCartButton
          product={product}
          disabled={
            product.type === 'ticket' &&
            ((user && !canPurchaseTickets(user)) ||
              product.ticketsRemaining === 0 ||
              cannotBuyMore)
          }
          label={
            product.ticketsRemaining === 0
              ? 'SOLD OUT'
              : cannotBuyMore
                ? showLimitDetails
                  ? 'LIMIT REACHED'
                  : 'UNAVAILABLE'
              : user && !canPurchaseTickets(user)
                ? 'VERIFICATION REQUIRED'
                : undefined
          }
        />
      )}
      <div className="cart-actions">
        <Link href="/shop" className="btn btn--ghost">
          ← All products
        </Link>
      </div>
    </SiteChrome>
  );
}
