import type { Role, VerificationStatus } from '@/generated/prisma/client';
import { canPurchaseTickets } from '@/lib/verification';

type EventPurchaseFlags = {
  isFreeEntry?: boolean;
  allowUnverifiedIdPurchase?: boolean;
};

export function eventAllowsUnverifiedIdPurchase(event: EventPurchaseFlags | null | undefined): boolean {
  if (!event || event.isFreeEntry) return false;
  return Boolean(event.allowUnverifiedIdPurchase);
}

/** Paid checkout allowed (verified account or this event’s ID-only mode). */
export function canBuyPaidTicketsForEvent(
  user: { role: Role; verificationStatus: VerificationStatus } | null | undefined,
  event: EventPurchaseFlags | null | undefined,
): boolean {
  if (!user || event?.isFreeEntry) return false;
  if (canPurchaseTickets(user)) return true;
  return eventAllowsUnverifiedIdPurchase(event);
}
