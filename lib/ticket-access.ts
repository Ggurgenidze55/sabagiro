import type { Role, VerificationStatus } from '@/generated/prisma/client';
import { canPurchaseTickets } from '@/lib/verification';

export type TicketAccessUser = {
  role: Role;
  verificationStatus: VerificationStatus;
} | null;

export type TicketAccessNotice = {
  message: string;
  hint?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function showCartInNav(user: TicketAccessUser): boolean {
  if (!user) return false;
  return canPurchaseTickets(user);
}

export function getTicketAccessNotice(user: TicketAccessUser): TicketAccessNotice | null {
  if (!user) {
    return {
      message: 'Register and log in to buy tickets.',
      hint: 'Create an account, then complete admin verification.',
      primaryHref: '/register',
      primaryLabel: 'Register',
      secondaryHref: '/login',
      secondaryLabel: 'Log in',
    };
  }

  if (!canPurchaseTickets(user)) {
    if (user.verificationStatus === 'REJECTED') {
      return {
        message: 'Ticket purchase is unavailable — your account was not approved.',
        hint: 'Update your Facebook and Instagram links, then contact us.',
        primaryHref: '/account/settings',
        primaryLabel: 'Settings',
        secondaryHref: '/contact',
        secondaryLabel: 'Contact',
      };
    }

    return {
      message: 'Admin verification is required before you can buy tickets.',
      hint: 'You are signed in — we are waiting for an administrator to approve your account.',
      primaryHref: '/account',
      primaryLabel: 'Account',
      secondaryHref: '/account/settings',
      secondaryLabel: 'Settings',
    };
  }

  return null;
}

export function showFreeTicketsInNav(
  user: (TicketAccessUser & { freeTicketsEnabled?: boolean }) | null,
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return false;
  return user.freeTicketsEnabled === true && user.verificationStatus === 'VERIFIED';
}

export function getAddToCartLabel(user: TicketAccessUser): string | undefined {
  if (!user) return 'Registration required';
  if (!canPurchaseTickets(user)) return 'Verification required';
  return undefined;
}

export function canGenerateFreeTicketsForEvent(
  user: (TicketAccessUser & { freeTicketsEnabled?: boolean }) | null,
  isFreeEntry: boolean,
): boolean {
  if (!isFreeEntry) return false;
  return showFreeTicketsInNav(user);
}
