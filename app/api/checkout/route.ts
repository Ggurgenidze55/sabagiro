import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPendingOrder } from '@/lib/payments/create-order';
import { startPaymentForOrder } from '@/lib/payments/start-payment';
import {
  getTicketLimitPerEvent,
  ticketAlreadyOwnedMessage,
  ticketLimitMessage,
} from '@/lib/ticket-purchase-limit';
import { canPurchaseTickets } from '@/lib/verification';
import { PROFILE_INCOMPLETE_MESSAGE } from '@/lib/user-ticket-holder';
import { checkoutSchema } from '@/lib/validators';

export async function POST(request: Request) {
  let purchaseLimit = 1;
  let showLimitDetails = false;

  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
    purchaseLimit = getTicketLimitPerEvent(user);
    showLimitDetails = user.freeTicketsEnabled;

    if (!canPurchaseTickets(user)) {
      return NextResponse.json(
        {
          error:
            'Ticket purchase requires verified account. Wait for admin approval after registration.',
          code: 'NOT_VERIFIED',
        },
        { status: 403 },
      );
    }

    const { items } = checkoutSchema.parse(await request.json());
    const order = await createPendingOrder(user, items);
    const payment = await startPaymentForOrder(order);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      redirectUrl: payment.redirectUrl,
      testMode: payment.testMode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'FREE_ENTRY_ONLY') {
      return NextResponse.json(
        {
          error: 'This event is free entry — use Free tickets in your account, not checkout.',
          code: 'FREE_ENTRY_ONLY',
        },
        { status: 403 },
      );
    }
    if (message === 'SOLD_OUT') {
      return NextResponse.json({ error: 'Not enough tickets left for this event' }, { status: 409 });
    }
    if (message === 'HOLDER_REQUIRED') {
      return NextResponse.json(
        {
          error: 'Please provide full holder details for each additional ticket.',
          code: 'HOLDER_REQUIRED',
        },
        { status: 400 },
      );
    }
    if (message === 'PROFILE_INCOMPLETE') {
      return NextResponse.json(
        { error: PROFILE_INCOMPLETE_MESSAGE, code: 'PROFILE_INCOMPLETE' },
        { status: 400 },
      );
    }
    if (message === 'NO_ITEMS') {
      return NextResponse.json({ error: 'No valid tickets in order' }, { status: 400 });
    }
    if (message === 'FLITT_NO_REDIRECT') {
      return NextResponse.json(
        { error: 'Payment provider could not start checkout. Try again later.' },
        { status: 502 },
      );
    }
    if (message === 'ALREADY_OWNED' || message === 'TICKET_LIMIT') {
      return NextResponse.json(
        {
          error:
            message === 'ALREADY_OWNED'
              ? showLimitDetails
                ? ticketAlreadyOwnedMessage(purchaseLimit)
                : 'Ticket purchase is currently unavailable. Please contact support.'
              : showLimitDetails
                ? ticketLimitMessage(purchaseLimit)
                : 'Ticket quantity could not be processed. Please contact support.',
          code: message,
        },
        { status: message === 'ALREADY_OWNED' ? 409 : 400 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
