import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchEmail } from '@/lib/email/dispatch';
import { createFreeTicketForVerifiedUser, deliverTicketEmail } from '@/lib/tickets';
import {
  countFreeTicketsForEvent,
  remainingFreeTicketsForEvent,
} from '@/lib/ticket-purchase-limit';
import { resolveNextTicketHolder } from '@/lib/resolve-ticket-holder';
import { canPurchaseTickets } from '@/lib/verification';
import { formatValidationError, freeTicketGenerateSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

    if (!canPurchaseTickets(user)) {
      return NextResponse.json(
        { error: 'Free tickets are available only for verified accounts.', code: 'NOT_VERIFIED' },
        { status: 403 },
      );
    }

    if (!user.freeTicketsEnabled) {
      return NextResponse.json(
        { error: 'Free ticket generator is not enabled on your account.', code: 'NO_FREE_TICKETS' },
        { status: 403 },
      );
    }

    const body = freeTicketGenerateSchema.parse(await request.json());
    const remainingForEvent = await remainingFreeTicketsForEvent(user, body.productSlug);

    if (remainingForEvent <= 0) {
      return NextResponse.json(
        {
          error: `Free ticket limit reached for this event (${user.freeTicketsQuota}/event).`,
          code: 'NO_FREE_TICKETS',
        },
        { status: 409 },
      );
    }

    const existingFree = await countFreeTicketsForEvent(user.id, body.productSlug);
    const resolved = resolveNextTicketHolder(existingFree, user, body);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error, code: resolved.code },
        { status: 400 },
      );
    }

    const ticket = await createFreeTicketForVerifiedUser({
      owner: user,
      productSlug: body.productSlug,
      holder: resolved.holder,
    });

    const email = await dispatchEmail('account:free-ticket', () => deliverTicketEmail(ticket), {
      required: true,
    });

    return NextResponse.json({ ok: true, ticket, email });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'NO_FREE_TICKETS') {
      return NextResponse.json(
        { error: 'Free ticket limit reached.', code: 'NO_FREE_TICKETS' },
        { status: 409 },
      );
    }
    if (message === 'INVALID_PRODUCT') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    if (message === 'HOLDER_REQUIRED') {
      return NextResponse.json(
        { error: 'Enter guest holder details for this ticket.', code: 'HOLDER_REQUIRED' },
        { status: 400 },
      );
    }
    if (message === 'EMAIL_NOT_SENT') {
      return NextResponse.json(
        { error: 'Ticket created but email could not be sent. Check your inbox in account.', code: 'EMAIL_FAILED' },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: formatValidationError(e) }, { status: 400 });
  }
}
