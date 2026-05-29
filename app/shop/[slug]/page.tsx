import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
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
  const aboutText = product.about?.trim() || product.description;
  const isTicket = product.type === 'ticket';

  return (
    <SiteChrome current="shop">
      <article
        className="event-page"
        style={{ ['--event-accent' as string]: product.accent }}
      >
        <header className="event-page__head">
          {product.tag ? <p className="event-page__tag">{product.tag}</p> : null}
          <h1 className="event-page__title">{product.name}</h1>
          {isTicket && product.description && product.about?.trim() ? (
            <p className="event-page__lineup">{product.description}</p>
          ) : null}
        </header>

        {isTicket && product.imagePath ? (
          <div className="event-hero-image">
            <img src={product.imagePath} alt={product.name} className="event-hero-image__img" />
            <div className="event-hero-image__pixel" aria-hidden />
            <div className="event-hero-image__fade" aria-hidden />
          </div>
        ) : null}

        {aboutText ? (
          <section className="event-page__about" aria-label="About this event">
            <h2 className="event-page__section-label">About</h2>
            <p className="event-about">{aboutText}</p>
          </section>
        ) : null}

        <div className="event-page__price-card">
          <span className="event-page__price-label">Ticket</span>
          <p className="event-page__price">{formatGel(product.priceGel)}</p>
          {isTicket && product.ticketsRemaining === 0 ? (
            <p className="event-page__stock">Sold out</p>
          ) : null}
        </div>

        <div className="event-page__notices">
          {isTicket && user && !canPurchaseTickets(user) ? (
            <p className="notice-banner notice-banner--inline">
              Ticket purchase requires a verified account. Status: {user.verificationStatus}.
              Check your account page after admin review.
            </p>
          ) : null}

          {isTicket &&
          user &&
          canPurchaseTickets(user) &&
          cannotBuyMore &&
          showLimitDetails ? (
            <p className="notice-banner notice-banner--inline">
              Purchase limit reached for this event ({purchaseLimit}).
              <Link href="/account" className="btn btn--ghost event-page__notice-btn">
                My tickets
              </Link>
            </p>
          ) : null}

          {isTicket &&
          user &&
          canPurchaseTickets(user) &&
          !cannotBuyMore &&
          purchaseLimit > 1 &&
          showLimitDetails ? (
            <p className="event-page__hint">
              You can buy {purchaseRemaining} more ticket(s) for this event (limit {purchaseLimit}
              ).
            </p>
          ) : null}
        </div>

        <div className="event-page__actions">
          {isTicket && product.ticketsRemaining === 0 ? (
            <p className="form-error event-page__sold-out">Sold out</p>
          ) : (
            <AddToCartButton
              product={product}
              disabled={
                isTicket &&
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
          <Link href="/shop" className="btn btn--ghost">
            ← All events
          </Link>
        </div>
      </article>
    </SiteChrome>
  );
}
