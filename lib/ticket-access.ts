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

export function canUseFreeTicketGenerator(
  user: (TicketAccessUser & { freeTicketsEnabled?: boolean }) | null,
): boolean {
  return showFreeTicketsInNav(user);
}

/** @deprecated Use canUseFreeTicketGenerator — quota applies per event, not only free-entry events. */
export function canGenerateFreeTicketsForEvent(
  user: (TicketAccessUser & { freeTicketsEnabled?: boolean }) | null,
): boolean {
  return canUseFreeTicketGenerator(user);
}

export function getFreeTicketAccessNotice(
  user: (TicketAccessUser & { freeTicketsEnabled?: boolean }) | null,
): TicketAccessNotice | null {
  if (canUseFreeTicketGenerator(user)) return null;

  if (!user) {
    return {
      message: 'Register and log in to get your free ticket.',
      hint: 'Create an account, then complete admin verification.',
      primaryHref: '/register',
      primaryLabel: 'Register',
      secondaryHref: '/login',
      secondaryLabel: 'Log in',
    };
  }

  if (!canPurchaseTickets(user)) {
    return getTicketAccessNotice(user);
  }

  return {
    message: 'Free ticket generator is not enabled on your account.',
    hint: 'Complimentary access is for invited guests only.',
    primaryHref: '/contact',
    primaryLabel: 'Contact',
    secondaryHref: '/account',
    secondaryLabel: 'Account',
  };
}
