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

/** Admin bulk send — appends "Guest N" to last name when quantity > 1. */
export function adminInvitationHolder(
  guest: InvitationGuest,
  index: number,
  quantity: number,
) {
  if (quantity === 1) {
    return invitationGuestToHolder(guest);
  }
  return invitationGuestToHolder({
    ...guest,
    lastName: `${guest.lastName} Guest ${index}`,
  });
}
