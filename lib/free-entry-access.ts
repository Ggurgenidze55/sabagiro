import type { TicketAccessNotice } from '@/lib/ticket-access';
import { canPurchaseTickets } from '@/lib/verification';

export type FreeEntryAccessMode = 'ALL_VERIFIED' | 'INVITED_ONLY';

export const VERIFIED_FREE_ENTRY_LIMIT = 1;

/** Per-event free limit for verified members on ALL_VERIFIED events. */
export function getVerifiedMemberFreeLimit(user: {
  freeTicketsEnabled?: boolean;
  freeTicketsQuota?: number;
}): number {
  if (user.freeTicketsEnabled && (user.freeTicketsQuota ?? 0) > 0) {
    return user.freeTicketsQuota!;
  }
  return VERIFIED_FREE_ENTRY_LIMIT;
}

export type FreeEntryEventMeta = {
  isFreeEntry: boolean;
  freeEntryAccess: FreeEntryAccessMode;
};

export type FreeTicketAccessUser = {
  role: import('@/generated/prisma/client').Role;
  verificationStatus: import('@/generated/prisma/client').VerificationStatus;
  freeTicketsEnabled?: boolean;
  freeTicketsQuota?: number;
} | null;

export function freeEntryAccessLabel(access: FreeEntryAccessMode): string {
  return access === 'ALL_VERIFIED'
    ? 'All verified — 1 ticket each'
    : 'Invited accounts only';
}

export function freeEntryAccessAdminHint(access: FreeEntryAccessMode): string {
  return access === 'ALL_VERIFIED'
    ? 'Every verified member gets 1 free ticket per event. Invited accounts with generator enabled use their full quota (e.g. 20).'
    : 'Only accounts with free ticket generator enabled can claim tickets (uses their per-event quota).';
}

export function getFreeEntryQuotaLimit(
  user: { freeTicketsEnabled: boolean; freeTicketsQuota: number },
  event: FreeEntryEventMeta,
): number {
  if (!event.isFreeEntry) {
    return user.freeTicketsEnabled ? user.freeTicketsQuota : 0;
  }
  if (event.freeEntryAccess === 'ALL_VERIFIED') {
    return getVerifiedMemberFreeLimit(user);
  }
  return user.freeTicketsEnabled ? user.freeTicketsQuota : 0;
}

export function canAccessFreeTicketForEvent(
  user: FreeTicketAccessUser,
  event: FreeEntryEventMeta,
): boolean {
  if (!user || user.role === 'ADMIN') return false;
  if (!canPurchaseTickets(user)) return false;

  if (!event.isFreeEntry) {
    return user.freeTicketsEnabled === true;
  }

  if (event.freeEntryAccess === 'ALL_VERIFIED') return true;
  return user.freeTicketsEnabled === true;
}

export function showsOnlineInvitationForUser(
  user: FreeTicketAccessUser,
  event: FreeEntryEventMeta,
): boolean {
  if (!user || !canPurchaseTickets(user)) return event.isFreeEntry;
  return canAccessFreeTicketForEvent(user, event);
}

export function getFreeTicketEventNotice(
  user: FreeTicketAccessUser,
  event: FreeEntryEventMeta & { name?: string },
): TicketAccessNotice | null {
  if (!event.isFreeEntry) return null;
  if (canAccessFreeTicketForEvent(user, event)) return null;

  if (!user) {
    return {
      message: 'Register and log in to claim your online invitation.',
      hint:
        event.freeEntryAccess === 'ALL_VERIFIED'
          ? 'After admin verification, verified members get 1 free ticket for this event.'
          : 'Complimentary access is for invited accounts only.',
      primaryHref: '/register',
      primaryLabel: 'Register',
      secondaryHref: '/login',
      secondaryLabel: 'Log in',
    };
  }

  if (!canPurchaseTickets(user)) {
    if (user.verificationStatus === 'REJECTED') {
      return {
        message: 'Online invitation is unavailable — your account was not approved.',
        hint: 'Update your Facebook and Instagram links, then contact us.',
        primaryHref: '/account/settings',
        primaryLabel: 'Settings',
        secondaryHref: '/contact',
        secondaryLabel: 'Contact',
      };
    }
    return {
      message: 'Admin verification is required before you can claim an online invitation.',
      hint: 'You are signed in — we are waiting for an administrator to approve your account.',
      primaryHref: '/account',
      primaryLabel: 'Account',
      secondaryHref: '/account/settings',
      secondaryLabel: 'Settings',
    };
  }

  return {
    message: 'This event is invitation-only — free ticket generator is not enabled on your account.',
    hint: 'Contact us if you believe you should have complimentary access.',
    primaryHref: '/contact',
    primaryLabel: 'Contact',
    secondaryHref: '/account',
    secondaryLabel: 'Account',
  };
}

export function getFreeTicketQuotaNotice(
  user: FreeTicketAccessUser,
  event: FreeEntryEventMeta,
  remaining: number,
): string | null {
  if (!canAccessFreeTicketForEvent(user, event)) return null;
  if (remaining > 0) {
    const limit = user ? getFreeEntryQuotaLimit(user as { freeTicketsEnabled: boolean; freeTicketsQuota: number }, event) : 0;
    if (event.isFreeEntry && event.freeEntryAccess === 'ALL_VERIFIED') {
      if (user?.freeTicketsEnabled && (user.freeTicketsQuota ?? 0) > VERIFIED_FREE_ENTRY_LIMIT) {
        return `${user.freeTicketsQuota} free ticket(s) per event on your account.`;
      }
      return `${VERIFIED_FREE_ENTRY_LIMIT} free ticket per verified member for this event.`;
    }
    if (user?.freeTicketsQuota) {
      return `${limit} free ticket(s) per event on your account.`;
    }
  }
  return null;
}
