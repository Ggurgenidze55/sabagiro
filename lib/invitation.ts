/** Placeholder holder fields when an invitation is sent without ID / phone. */
export const INVITATION_PLACEHOLDER_PERSONAL_ID = '00000000000';
export const INVITATION_PLACEHOLDER_PHONE = '—';

export const INVITATION_NAV_LABEL = 'Invitations';
export const INVITATION_PAGE_TITLE = 'INVITATIONS';
export const INVITATION_GENERATOR_TITLE = 'Invitation generator';
export const INVITATION_TIER_LABEL = 'Invitation';

export const ADMIN_GENERATE_QUANTITY_MIN = 1;
export const ADMIN_GENERATE_QUANTITY_MAX = 20;

export type InvitationGuest = {
  firstName: string;
  lastName: string;
  email: string;
};

export function invitationGuestToHolder(guest: InvitationGuest) {
  return {
    ...guest,
    personalId: INVITATION_PLACEHOLDER_PERSONAL_ID,
    phone: INVITATION_PLACEHOLDER_PHONE,
  };
}

export function invitationAccountDefaults(guest: InvitationGuest) {
  return {
    ...guest,
    personalId: INVITATION_PLACEHOLDER_PERSONAL_ID,
    phone: INVITATION_PLACEHOLDER_PHONE,
  };
}

const GUEST_SUFFIX_RE = /\bGuest\s+(\d+)\s*$/i;

/** Highest Guest N in last names, or ticket count if unnumbered tickets exist. */
export function nextAdminGuestNumberFromLastNames(
  holderLastNames: string[],
): number {
  let maxGuest = 0;
  for (const lastName of holderLastNames) {
    const match = lastName.match(GUEST_SUFFIX_RE);
    if (match) maxGuest = Math.max(maxGuest, Number(match[1]));
  }
  // Unnumbered tickets still consume a slot (e.g. first single invite).
  if (holderLastNames.length > maxGuest) {
    maxGuest = holderLastNames.length;
  }
  return maxGuest + 1;
}

/**
 * Admin invite holder naming.
 * - First ever single invite: plain last name
 * - Otherwise: "Lastname Guest N" continuing across batches for that email+event
 */
export function adminInvitationHolder(
  guest: InvitationGuest,
  guestNumber: number,
  opts: { useGuestSuffix: boolean },
) {
  if (!opts.useGuestSuffix) {
    return invitationGuestToHolder(guest);
  }
  return invitationGuestToHolder({
    ...guest,
    lastName: `${guest.lastName} Guest ${guestNumber}`,
  });
}
