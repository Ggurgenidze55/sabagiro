import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchEmail } from '@/lib/email/dispatch';
import { canAccessFreeTicketForEvent } from '@/lib/free-entry-access';
import { getProduct } from '@/lib/products';
import { resolveNextTicketHolder } from '@/lib/resolve-ticket-holder';
import { createFreeTicketForVerifiedUser, deliverTicketEmail } from '@/lib/tickets';
import {
  countFreeTicketsForEvent,
  freeTicketLimitMessage,
  remainingFreeTicketsForEvent,
} from '@/lib/ticket-purchase-limit';
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

    const body = freeTicketGenerateSchema.parse(await request.json());
    const product = await getProduct(body.productSlug);
    if (!product || product.type !== 'ticket') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const eventMeta = {
      isFreeEntry: Boolean(product.isFreeEntry),
      freeEntryAccess: product.freeEntryAccess ?? 'INVITED_ONLY',
    };

    if (!canAccessFreeTicketForEvent(user, eventMeta)) {
      return NextResponse.json(
        {
          error:
            eventMeta.isFreeEntry && eventMeta.freeEntryAccess === 'INVITED_ONLY'
              ? 'Free ticket generator is not enabled on your account.'
              : 'You cannot claim a free ticket for this event.',
          code: 'NO_FREE_TICKETS',
        },
        { status: 403 },
      );
    }

    const remainingForEvent = await remainingFreeTicketsForEvent(user, body.productSlug, eventMeta);

    if (remainingForEvent <= 0) {
      return NextResponse.json(
        {
          error: freeTicketLimitMessage(user, eventMeta),
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
