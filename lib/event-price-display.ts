import { formatGel } from '@/lib/format-gel';

export const ONLINE_INVITATION_LABEL = 'Online invitation';

type PublicEventPriceOptions = {
  isLoggedIn: boolean;
  isFreeEntry: boolean;
  priceGel: number;
  ticketsRemaining?: number;
};

/** Public event cards: hide price when logged out; free → invitation label; paid → current tier price. */
export function getPublicEventPriceDisplay({
  isLoggedIn,
  isFreeEntry,
  priceGel,
  ticketsRemaining,
}: PublicEventPriceOptions): string | null {
  if (!isLoggedIn) return null;
  if (isFreeEntry) return ONLINE_INVITATION_LABEL;
  if (ticketsRemaining === 0) return 'Sold out';
  return formatGel(priceGel);
}

export function getPublicEventCtaLabel(options: {
  isFreeEntry: boolean;
  ticketsRemaining?: number;
}): string {
  if (options.isFreeEntry) return 'ONLINE INVITATION';
  if (options.ticketsRemaining === 0) return 'VIEW';
  return 'GET TICKETS';
}

export function getPublicEventPriceLabel(isFreeEntry: boolean): string {
  return isFreeEntry ? 'Invitation' : 'Ticket';
}
