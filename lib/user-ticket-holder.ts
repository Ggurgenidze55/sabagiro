export type TicketHolderFields = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

export type UserWithHolderFields = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

export function holderFromUser(user: UserWithHolderFields): TicketHolderFields {
  return {
    firstName: user.firstName.trim(),
    lastName: user.lastName.trim(),
    personalId: user.personalId.trim(),
    email: user.email.trim(),
    phone: user.phone.trim(),
  };
}

export function isProfileCompleteForTicket(user: UserWithHolderFields): boolean {
  const holder = holderFromUser(user);
  return (
    holder.firstName.length >= 2 &&
    holder.lastName.length >= 2 &&
    /^\d{11}$/.test(holder.personalId) &&
    holder.email.includes('@') &&
    holder.phone.length >= 9
  );
}

export const PROFILE_INCOMPLETE_MESSAGE =
  'Complete your profile (name, personal ID, email, phone) in Settings before getting a ticket.';
