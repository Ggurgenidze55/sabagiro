import { formatGel } from '@/lib/format-gel';

export const ONLINE_INVITATION_LABEL = 'Online invitation';

type PublicEventPriceOptions = {
  isLoggedIn: boolean;
  isFreeEntry: boolean;
  hasFreeTicketAccess?: boolean;
  priceGel: number;
  ticketsRemaining?: number;
};

/** Public event cards: hide price when logged out; invitation users / free-entry → invitation label. */
export function getPublicEventPriceDisplay({
  isLoggedIn,
  isFreeEntry,
  hasFreeTicketAccess = false,
  priceGel,
  ticketsRemaining,
}: PublicEventPriceOptions): string | null {
  if (!isLoggedIn) return null;
  if (isFreeEntry || hasFreeTicketAccess) return ONLINE_INVITATION_LABEL;
  if (ticketsRemaining === 0) return 'Sold out';
  return formatGel(priceGel);
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
