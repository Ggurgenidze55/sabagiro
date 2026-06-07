import { extraHolderCount } from '@/lib/ticket-holders';
import {
  holderFromUser,
  isProfileCompleteForTicket,
  PROFILE_INCOMPLETE_MESSAGE,
  type TicketHolderFields,
  type UserWithHolderFields,
} from '@/lib/user-ticket-holder';
import { ticketHolderSchema } from '@/lib/validators';

type ResolveResult =
  | { ok: true; holder: TicketHolderFields }
  | { ok: false; code: 'PROFILE_INCOMPLETE' | 'HOLDER_REQUIRED'; error: string };

export function resolveNextTicketHolder(
  existingTicketCount: number,
  user: UserWithHolderFields,
  manual?: Partial<TicketHolderFields>,
): ResolveResult {
  const needsManualHolder = extraHolderCount(1, existingTicketCount) > 0;

  if (!needsManualHolder) {
    if (!isProfileCompleteForTicket(user)) {
      return { ok: false, code: 'PROFILE_INCOMPLETE', error: PROFILE_INCOMPLETE_MESSAGE };
    }
    return { ok: true, holder: holderFromUser(user) };
  }

  const parsed = ticketHolderSchema.safeParse(manual);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'HOLDER_REQUIRED',
      error: 'Enter holder details for the guest receiving this ticket.',
    };
  }

  return { ok: true, holder: parsed.data };
}
