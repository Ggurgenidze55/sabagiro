import { formatGelWithCode } from '@/lib/format-gel';

export const ONLINE_INVITATION_LABEL = 'Online invitation';

type PublicEventPriceOptions = {
  isLoggedIn: boolean;
  isFreeEntry: boolean;
  hasFreeTicketAccess?: boolean;
  priceGel: number;
  ticketsRemaining?: number;
};

/**
 * Public event cards must show GEL prices (Flitt / card-scheme).
 * Invitation label only when the viewer actually has complimentary access.
 */
export function getPublicEventPriceDisplay({
  isLoggedIn,
  isFreeEntry,
  hasFreeTicketAccess = false,
  priceGel,
  ticketsRemaining,
}: PublicEventPriceOptions): string | null {
  if (ticketsRemaining === 0) return 'Sold out';
  if (hasFreeTicketAccess) return ONLINE_INVITATION_LABEL;
  if (isFreeEntry) {
    if (isLoggedIn) return ONLINE_INVITATION_LABEL;
    return '0 ₾ (GEL)';
  }
  return formatGelWithCode(priceGel);
}

export function getPublicEventCtaLabel(options: {
  isFreeEntry: boolean;
  hasFreeTicketAccess?: boolean;
  ticketsRemaining?: number;
}): string {
  if (options.isFreeEntry || options.hasFreeTicketAccess) return 'ONLINE INVITATION';
  if (options.ticketsRemaining === 0) return 'VIEW';
  return 'GET TICKETS';
}

export function getPublicEventPriceLabel(isFreeEntry: boolean, hasFreeTicketAccess = false): string {
  return isFreeEntry || hasFreeTicketAccess ? 'Invitation' : 'Ticket';
}

/** Always-visible product blurb for listings and Flitt product description checks. */
export function getEventPublicDescription(opts: {
  name: string;
  about?: string | null;
  description?: string | null;
  lineup?: string | null;
}): string {
  const about = opts.about?.trim();
  if (about) return about;
  const lineup = opts.lineup?.trim();
  if (lineup) return lineup;
  const description = opts.description?.trim();
  if (description) return description;
  return `${opts.name} — Sabagiro event ticket. Entry in Tbilisi. Price in GEL (₾).`;
}
