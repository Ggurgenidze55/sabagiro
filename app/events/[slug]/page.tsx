import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EventTicketButton } from '@/components/EventTicketButton';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import {
  canAccessFreeTicketForEvent,
  getFreeTicketEventNotice,
  getFreeTicketQuotaNotice,
  showsOnlineInvitationForUser,
  VERIFIED_FREE_ENTRY_LIMIT,
} from '@/lib/free-entry-access';
import { getSessionUser } from '@/lib/auth';
import { normalizeEventSlug } from '@/lib/events';
import { extraHolderCount } from '@/lib/ticket-holders';
import {
  countFreeTicketsForEvent,
  countPurchasedTicketsForEvent,
  freeTicketLimitMessage,
  getTicketLimitPerEvent,
  remainingFreeTicketsForEvent,
  remainingPurchaseSlots,
} from '@/lib/ticket-purchase-limit';
import { canPurchaseTickets } from '@/lib/verification';
import { isProfileCompleteForTicket } from '@/lib/user-ticket-holder';
import {
  getPublicEventPriceDisplay,
  getPublicEventPriceLabel,
  ONLINE_INVITATION_LABEL,
} from '@/lib/event-price-display';
import { getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Not found — Sabagiro' };
  return { title: `${product.name} — Sabagiro Events` };
}

export default async function EventPage({ params }: PageProps) {
  const user = await getSessionUser();
  const decoded = decodeURIComponent(params.slug);
  const canonical = normalizeEventSlug(decoded);
  if (decoded !== canonical) {
    const legacy = await getProduct(decoded);
    if (legacy) redirect(`/events/${canonical}`);
  }

  const product = await getProduct(params.slug);
  if (!product) notFound();

  if (product.type === 'merch') {
    redirect('/events');
  }

  const isFreeEntry = Boolean(product.isFreeEntry);
  const eventMeta = {
    isFreeEntry,
    freeEntryAccess: product.freeEntryAccess ?? 'INVITED_ONLY',
  };
  const canAccessFree = canAccessFreeTicketForEvent(user, eventMeta);
  const showInvitationPrice = showsOnlineInvitationForUser(user, eventMeta);

  const purchaseLimit = user ? getTicketLimitPerEvent(user) : 1;
  const purchaseRemaining =
    user && product.type === 'ticket'
      ? await remainingPurchaseSlots(user, product.slug)
      : purchaseLimit;
  const cannotBuyMore = Boolean(
    user && product.type === 'ticket' && purchaseRemaining <= 0,
  );
  const showLimitDetails = Boolean(user?.freeTicketsEnabled);
  const freeTicketsRemaining = user && canAccessFree
    ? await remainingFreeTicketsForEvent(user, product.slug, eventMeta)
    : 0;
  const existingPurchased =
    user && product.type === 'ticket'
      ? await countPurchasedTicketsForEvent(user.id, product.slug)
      : 0;
  const existingFree =
    user && canAccessFree ? await countFreeTicketsForEvent(user.id, product.slug) : 0;
  const profileComplete = Boolean(user && isProfileCompleteForTicket(user));
  const allowsGuestFreeTickets =
    canAccessFree &&
    eventMeta.isFreeEntry &&
    eventMeta.freeEntryAccess === 'INVITED_ONLY' &&
    (user?.freeTicketsQuota ?? 0) > 1;
  const canInstantFreeTicket =
    Boolean(user) &&
    canPurchaseTickets(user!) &&
    profileComplete &&
    canAccessFree &&
    freeTicketsRemaining > 0 &&
    existingFree === 0;
  const canGuestFreeTicket =
    Boolean(user) &&
    canPurchaseTickets(user!) &&
    canAccessFree &&
    allowsGuestFreeTickets &&
    freeTicketsRemaining > 0 &&
    existingFree > 0;
  const useInstantPaidCheckout =
    !canAccessFree &&
    Boolean(user) &&
    canPurchaseTickets(user!) &&
    profileComplete &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    extraHolderCount(1, existingPurchased) === 0;
  const canGuestPaidTicket =
    !canAccessFree &&
    Boolean(user) &&
    canPurchaseTickets(user!) &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    existingPurchased > 0;
  const freeEventNotice = isFreeEntry ? getFreeTicketEventNotice(user, eventMeta) : null;
  const quotaNotice = getFreeTicketQuotaNotice(user, eventMeta, freeTicketsRemaining);
  const aboutText = product.about?.trim() || product.description;
  const priceDisplay = getPublicEventPriceDisplay({
    isLoggedIn: Boolean(user),
    isFreeEntry,
    hasFreeTicketAccess: showInvitationPrice,
    priceGel: product.priceGel,
    ticketsRemaining: product.ticketsRemaining,
  });

  return (
    <SiteChrome current="events">
      <article
        className="event-page"
        style={{ ['--event-accent' as string]: product.accent }}
      >
        <header className="event-page__head">
          {product.tag ? <p className="event-page__tag">{product.tag}</p> : null}
          <h1 className="event-page__title">{product.name}</h1>
        </header>

        {product.imagePath ? (
          <div className="event-hero-image">
            <img src={product.imagePath} alt={product.name} className="event-hero-image__img" />
            <div className="event-hero-image__pixel" aria-hidden />
            <div className="event-hero-image__fade" aria-hidden />
          </div>
        ) : null}

        {aboutText || product.lineup ? (
          <section className="event-page__about" aria-label="About this event">
            <h2 className="event-page__section-label">About</h2>
            {product.lineup ? (
              <p className="event-page__about-lineup">{product.lineup}</p>
            ) : null}
            {aboutText ? <p className="event-about">{aboutText}</p> : null}
          </section>
        ) : null}

        {priceDisplay ? (
          <div className="event-page__price-card">
            <span className="event-page__price-label">
              {getPublicEventPriceLabel(isFreeEntry, showInvitationPrice)}
            </span>
            <p className="event-page__price">{priceDisplay}</p>
          </div>
        ) : null}

        <div className="event-page__notices">
          {isFreeEntry ? (
            <>
              <p className="notice-banner notice-banner--inline">
                {ONLINE_INVITATION_LABEL} —{' '}
                {eventMeta.freeEntryAccess === 'ALL_VERIFIED'
                  ? `open to all verified members (${VERIFIED_FREE_ENTRY_LIMIT} ticket each).`
                  : 'complimentary access for invited accounts only.'}
              </p>
              {freeEventNotice ? (
                <TicketAccessNotice user={user} getNotice={() => freeEventNotice} />
              ) : null}
            </>
          ) : canAccessFree ? (
            <p className="notice-banner notice-banner--inline">
              {ONLINE_INVITATION_LABEL} — your account includes free tickets for this event.
            </p>
          ) : (
            <TicketAccessNotice user={user} />
          )}

          {quotaNotice ? <p className="event-page__hint">{quotaNotice}</p> : null}

          {user && canPurchaseTickets(user) && !profileComplete && (canAccessFree || !isFreeEntry) ? (
            <p className="notice-banner notice-banner--inline">
              Complete your profile in Settings before getting a ticket.{' '}
              <Link href="/account/settings" className="btn btn--ghost event-page__notice-btn">
                Settings
              </Link>
            </p>
          ) : null}

          {canAccessFree && freeTicketsRemaining <= 0 ? (
            <p className="notice-banner notice-banner--inline">
              {freeTicketLimitMessage(user!, eventMeta)}
              <Link href="/account" className="btn btn--ghost event-page__notice-btn">
                My tickets
              </Link>
            </p>
          ) : null}

          {!canAccessFree &&
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

          {canGuestFreeTicket ? (
            <p className="event-page__hint">
              Additional free tickets require guest holder details.
            </p>
          ) : null}

          {!canAccessFree &&
          user &&
          canPurchaseTickets(user) &&
          !cannotBuyMore &&
          existingPurchased > 0 ? (
            <p className="event-page__hint">
              Additional paid tickets require guest holder details below.
            </p>
          ) : null}

          {!canAccessFree &&
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
          {canInstantFreeTicket ? (
            <EventTicketButton slug={product.slug} isFreeEntry />
          ) : canGuestFreeTicket ? (
            <EventTicketButton
              slug={product.slug}
              isFreeEntry
              needsHolderForm
              ticketNumber={existingFree + 1}
            />
          ) : !canAccessFree && product.ticketsRemaining === 0 ? (
            <p className="form-error event-page__sold-out">Sold out</p>
          ) : useInstantPaidCheckout ? (
            <EventTicketButton slug={product.slug} isFreeEntry={false} label="Buy ticket" />
          ) : canGuestPaidTicket ? (
            <EventTicketButton
              slug={product.slug}
              isFreeEntry={false}
              needsHolderForm
              ticketNumber={existingPurchased + 1}
            />
          ) : null}
          <Link href="/events" className="btn btn--ghost">
            ← All events
          </Link>
        </div>
      </article>
    </SiteChrome>
  );
}
