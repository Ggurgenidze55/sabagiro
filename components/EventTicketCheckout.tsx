'use client';

import { useState } from 'react';
import { EventPromoCodeField } from '@/components/EventPromoCodeField';
import { EventTicketButton } from '@/components/EventTicketButton';

type EventTicketCheckoutProps = {
  slug: string;
  isFreeEntry: boolean;
  canInstantFreeTicket?: boolean;
  canGuestFreeTicket?: boolean;
  useInstantPaidCheckout?: boolean;
  useIdOnlyPaidCheckout?: boolean;
  canGuestPaidTicket?: boolean;
  useIdOnlyGuestPaid?: boolean;
  guestIdOnlyCheckout?: boolean;
  existingFree?: number;
  existingPurchased?: number;
};

export function EventTicketCheckout(props: EventTicketCheckoutProps) {
  const {
    slug,
    isFreeEntry,
    canInstantFreeTicket,
    canGuestFreeTicket,
    useInstantPaidCheckout,
    useIdOnlyPaidCheckout,
    canGuestPaidTicket,
    useIdOnlyGuestPaid,
    guestIdOnlyCheckout,
    existingFree = 0,
    existingPurchased = 0,
  } = props;

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const showPromo =
    !isFreeEntry &&
    (useInstantPaidCheckout ||
      useIdOnlyPaidCheckout ||
      canGuestPaidTicket ||
      useIdOnlyGuestPaid ||
      guestIdOnlyCheckout);

  return (
    <div className="event-ticket-checkout">
      {showPromo ? <EventPromoCodeField eventSlug={slug} onApplied={(code) => setPromoCode(code)} /> : null}
      {canInstantFreeTicket ? (
        <EventTicketButton slug={slug} isFreeEntry promoCode={promoCode} />
      ) : canGuestFreeTicket ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry
          needsHolderForm
          ticketNumber={existingFree + 1}
          promoCode={promoCode}
        />
      ) : useInstantPaidCheckout ? (
        <EventTicketButton slug={slug} isFreeEntry={false} label="Buy ticket" promoCode={promoCode} />
      ) : guestIdOnlyCheckout ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry={false}
          needsHolderForm
          ticketNumber={1}
          label="Buy ticket"
          promoCode={promoCode}
          requireAdultConfirm
          requireIdAtDoorConfirm
          requireHolderAge
          guestCheckout
          holderFormLead="Buy without an account — enter your details (18+ and ID at the door required)"
        />
      ) : useIdOnlyPaidCheckout ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry={false}
          needsHolderForm
          ticketNumber={1}
          label="Buy ticket"
          promoCode={promoCode}
          requireAdultConfirm
          requireIdAtDoorConfirm
          requireHolderAge
          holderFormLead="Ticket holder — ID/passport and 18+ required (no account verification for this event)"
        />
      ) : canGuestPaidTicket ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry={false}
          needsHolderForm
          ticketNumber={existingPurchased + 1}
          promoCode={promoCode}
          requireHolderAge
        />
      ) : useIdOnlyGuestPaid ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry={false}
          needsHolderForm
          ticketNumber={existingPurchased + 1}
          promoCode={promoCode}
          requireAdultConfirm
          requireIdAtDoorConfirm
          requireHolderAge
          holderFormLead="Guest ticket — ID/passport and 18+ required"
        />
      ) : null}
    </div>
  );
}
