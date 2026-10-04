'use client';

import { useState } from 'react';
import { EventPromoCodeField } from '@/components/EventPromoCodeField';
import { EventTicketButton } from '@/components/EventTicketButton';

type EventTicketCheckoutProps = {
  slug: string;
  isFreeEntry: boolean;
  disabled?: boolean;
  canInstantFreeTicket?: boolean;
  canGuestFreeTicket?: boolean;
  useInstantPaidCheckout?: boolean;
  canGuestPaidTicket?: boolean;
  existingFree?: number;
  existingPurchased?: number;
  ticketsRemaining?: number;
};

export function EventTicketCheckout(props: EventTicketCheckoutProps) {
  const {
    slug,
    isFreeEntry,
    disabled,
    canInstantFreeTicket,
    canGuestFreeTicket,
    useInstantPaidCheckout,
    canGuestPaidTicket,
    existingFree = 0,
    existingPurchased = 0,
  } = props;

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const showPromo = !isFreeEntry && (useInstantPaidCheckout || canGuestPaidTicket);

  function onPromoApplied(code: string | null) {
    setPromoCode(code);
  }

  return (
    <div className="event-ticket-checkout">
      {showPromo ? <EventPromoCodeField eventSlug={slug} onApplied={onPromoApplied} /> : null}
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
      ) : canGuestPaidTicket ? (
        <EventTicketButton
          slug={slug}
          isFreeEntry={false}
          needsHolderForm
          ticketNumber={existingPurchased + 1}
          promoCode={promoCode}
        />
      ) : null}
    </div>
  );
}
