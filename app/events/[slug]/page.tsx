import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EventTicketCheckout } from '@/components/EventTicketCheckout';
import { PaymentBrandLogos } from '@/components/PaymentBrandLogos';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import {
  canAccessFreeTicketForEvent,
  getFreeEntryQuotaLimit,
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
import { canBuyPaidTicketsForEvent } from '@/lib/event-purchase-eligibility';
import { canPurchaseTickets } from '@/lib/verification';
import { isProfileCompleteForTicket } from '@/lib/user-ticket-holder';
import {
  getEventPublicDescription,
  getPublicEventPriceDisplay,
  getPublicEventPriceLabel,
  ONLINE_INVITATION_LABEL,
} from '@/lib/event-price-display';
import { formatDoorsOpenLabel } from '@/lib/format-doors-open';
import { getEventArchiveProduct, getProduct } from '@/lib/products';
import { isPastEventDate } from '@/lib/event-past';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const product = (await getEventArchiveProduct(params.slug)) ?? (await getProduct(params.slug));
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

  const product = (await getEventArchiveProduct(params.slug)) ?? (await getProduct(params.slug));
  if (!product) notFound();

  if (product.type === 'merch') {
    redirect('/events');
  }

  const pastEvent = isPastEventDate(product.eventDate);

  const isFreeEntry = Boolean(product.isFreeEntry);
  const eventMeta = {
    isFreeEntry,
    freeEntryAccess: product.freeEntryAccess ?? 'INVITED_ONLY',
  };
  const canAccessFree = canAccessFreeTicketForEvent(user, eventMeta);
  const showInvitationPrice = showsOnlineInvitationForUser(user, eventMeta);
  const perEventFreeLimit = user && canAccessFree ? getFreeEntryQuotaLimit(user, eventMeta) : 0;
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
  const allowIdOnlyPurchase =
    Boolean(product.allowUnverifiedIdPurchase) && !isFreeEntry && !pastEvent;
  const verifiedPurchaser = Boolean(user && canPurchaseTickets(user));
  const canPaidCheckout = Boolean(user && canBuyPaidTicketsForEvent(user, product));
  const allowsGuestFreeTickets = canAccessFree && perEventFreeLimit > 1;
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
    canPaidCheckout &&
    verifiedPurchaser &&
    profileComplete &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    extraHolderCount(1, existingPurchased) === 0;
  const useIdOnlyPaidCheckout =
    !canAccessFree &&
    canPaidCheckout &&
    !verifiedPurchaser &&
    allowIdOnlyPurchase &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    existingPurchased === 0;
  const canGuestPaidTicket =
    !canAccessFree &&
    canPaidCheckout &&
    verifiedPurchaser &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    existingPurchased > 0;
  const useIdOnlyGuestPaid =
    !canAccessFree &&
    canPaidCheckout &&
    !verifiedPurchaser &&
    allowIdOnlyPurchase &&
    !cannotBuyMore &&
    (product.ticketsRemaining ?? 0) > 0 &&
    existingPurchased > 0;
  // ID-only guest form is a fallback whenever no account checkout path is active.
  // Do not require !user — a sticky guest session that already owns a ticket used
  // to hide the form entirely (price visible, nothing to fill in).
  const hasAccountPaidOrFreeCheckout =
    canInstantFreeTicket ||
    canGuestFreeTicket ||
    useInstantPaidCheckout ||
    useIdOnlyPaidCheckout ||
    canGuestPaidTicket ||
    useIdOnlyGuestPaid;
  const guestIdOnlyCheckout =
    allowIdOnlyPurchase &&
    !isFreeEntry &&
    !pastEvent &&
    (product.ticketsRemaining ?? 0) > 0 &&
    !hasAccountPaidOrFreeCheckout;
  const freeEventNotice = isFreeEntry ? getFreeTicketEventNotice(user, eventMeta) : null;
  const quotaNotice = getFreeTicketQuotaNotice(user, eventMeta, freeTicketsRemaining);
  const aboutText = getEventPublicDescription({
    name: product.name,
    about: product.about,
    description: product.description,
    lineup: product.lineup,
  });
  const priceDisplay = pastEvent
    ? null
    : getPublicEventPriceDisplay({
        isLoggedIn: Boolean(user),
        isFreeEntry,
        hasFreeTicketAccess: showInvitationPrice,
        priceGel: product.priceGel,
        ticketsRemaining: product.ticketsRemaining,
      });
  const doorsOpenLabel = formatDoorsOpenLabel(product.doorsOpen);

  return (
    <SiteChrome current="events">
      <article
        className="event-page"
        style={{ ['--event-accent' as string]: product.accent }}
      >
        <header className="event-page__head">
          {product.tag ? <p className="event-page__tag">{product.tag}</p> : null}
          <h1 className="event-page__title">{product.name}</h1>
          {doorsOpenLabel ? <p className="event-page__doors-open">{doorsOpenLabel}</p> : null}
        </header>

        {product.imagePath ? (
          <div className="event-hero-image">
            <img src={product.imagePath} alt={product.name} className="event-hero-image__img" />
            <div className="event-hero-image__pixel" aria-hidden />
            <div className="event-hero-image__fade" aria-hidden />
          </div>
        ) : null}

        <section className="event-page__about" aria-label="About this event">
          <h2 className="event-page__section-label">About</h2>
          {product.lineup ? (
            <p className="event-page__about-lineup">{product.lineup}</p>
          ) : null}
          <p className="event-about">{aboutText}</p>
        </section>

        {priceDisplay ? (
          <div className="event-page__price-card">
            <span className="event-page__price-label">
              {getPublicEventPriceLabel(isFreeEntry, showInvitationPrice)}
            </span>
            <p className="event-page__price">{priceDisplay}</p>
            {!isFreeEntry && !showInvitationPrice ? (
              <PaymentBrandLogos className="payment-brands--event" />
            ) : null}
          </div>
        ) : null}

        <div className="event-page__notices">
          {pastEvent ? (
            <p className="notice-banner notice-banner--inline">This night is in the archive.</p>
          ) : null}
          {!pastEvent && isFreeEntry ? (
            <>
              <p className="notice-banner notice-banner--inline">
                {ONLINE_INVITATION_LABEL} —{' '}
                {eventMeta.freeEntryAccess === 'ALL_VERIFIED'
                  ? user?.freeTicketsEnabled && (user.freeTicketsQuota ?? 0) > VERIFIED_FREE_ENTRY_LIMIT
                    ? `open to all verified members (your account: ${user.freeTicketsQuota} tickets per event).`
                    : `open to all verified members (${VERIFIED_FREE_ENTRY_LIMIT} ticket each).`
                  : 'complimentary access for invited accounts only.'}
              </p>
              {freeEventNotice ? (
                <TicketAccessNotice user={user} getNotice={() => freeEventNotice} />
              ) : null}
            </>
          ) : !pastEvent && canAccessFree ? (
            <p className="notice-banner notice-banner--inline">
              {ONLINE_INVITATION_LABEL} — your account includes invitations for this event.
            </p>
          ) : !pastEvent && allowIdOnlyPurchase && (!user || !verifiedPurchaser) ? (
            <p className="notice-banner notice-banner--inline event-page__id-notice">
              {user ? (
                <>
                  Checkout without account verification — enter your ID/passport and age below.{' '}
                  <strong>Valid ID or passport is mandatory at the door (same document).</strong>
                </>
              ) : (
                <>
                  Buy without registration — fill in your details below.{' '}
                  <strong>Valid ID or passport is mandatory at the door (same document). 18+ only.</strong>
                </>
              )}
            </p>
          ) : !pastEvent && !isFreeEntry && user && verifiedPurchaser ? (
            <p className="notice-banner notice-banner--inline event-page__id-notice">
              <strong>Bring valid ID or passport to the door</strong> — it must match the ticket
              holder. 18+ only.
            </p>
          ) : !pastEvent ? (
            <TicketAccessNotice user={user} />
          ) : null}

          {!pastEvent && quotaNotice ? <p className="event-page__hint">{quotaNotice}</p> : null}

          {!pastEvent &&
          user &&
          canPurchaseTickets(user) &&
          !profileComplete &&
          (canAccessFree || !isFreeEntry) ? (
            <p className="notice-banner notice-banner--inline">
              Complete your profile in Settings before getting a ticket.{' '}
              <Link href="/account/settings" className="btn btn--ghost event-page__notice-btn">
                Settings
              </Link>
            </p>
          ) : null}

          {!pastEvent && canAccessFree && freeTicketsRemaining <= 0 ? (
            <p className="notice-banner notice-banner--inline">
              {freeTicketLimitMessage(user!, eventMeta)}
              <Link href="/account" className="btn btn--ghost event-page__notice-btn">
                My tickets
              </Link>
            </p>
          ) : null}

          {!pastEvent && !canAccessFree && user && cannotBuyMore ? (
            <p className="notice-banner notice-banner--inline">
              {showLimitDetails
                ? `Purchase limit reached for this event (${purchaseLimit}).`
                : 'This account already has a paid ticket for this event.'}
              {allowIdOnlyPurchase ? (
                <> Use the form below to buy for another person with their ID/email.</>
              ) : null}
              <Link href="/account" className="btn btn--ghost event-page__notice-btn">
                My tickets
              </Link>
            </p>
          ) : null}

          {!pastEvent && canGuestFreeTicket ? (
            <p className="event-page__hint">
              Additional invitations require guest name and email.
            </p>
          ) : null}

          {!pastEvent &&
          !canAccessFree &&
          user &&
          canPurchaseTickets(user) &&
          !cannotBuyMore &&
          existingPurchased > 0 ? (
            <p className="event-page__hint">
              Additional paid tickets require guest holder details below.
            </p>
          ) : null}

          {!pastEvent &&
          !canAccessFree &&
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
          {!pastEvent && !canAccessFree && product.ticketsRemaining === 0 ? (
            <p className="form-error event-page__sold-out">Sold out</p>
          ) : !pastEvent &&
            (canInstantFreeTicket ||
              canGuestFreeTicket ||
              useInstantPaidCheckout ||
              useIdOnlyPaidCheckout ||
              canGuestPaidTicket ||
              useIdOnlyGuestPaid ||
              guestIdOnlyCheckout) ? (
            <EventTicketCheckout
              slug={product.slug}
              unitPriceGel={product.priceGel ?? 0}
              isFreeEntry={isFreeEntry}
              canInstantFreeTicket={canInstantFreeTicket}
              canGuestFreeTicket={canGuestFreeTicket}
              useInstantPaidCheckout={useInstantPaidCheckout}
              useIdOnlyPaidCheckout={useIdOnlyPaidCheckout}
              canGuestPaidTicket={canGuestPaidTicket}
              useIdOnlyGuestPaid={useIdOnlyGuestPaid}
              guestIdOnlyCheckout={guestIdOnlyCheckout}
              existingFree={existingFree}
              existingPurchased={existingPurchased}
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
