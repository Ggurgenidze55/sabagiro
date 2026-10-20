import { NextResponse } from 'next/server';
import { getSessionUser, setSessionCookie, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { findOrCreateUserForGuestCheckout } from '@/lib/guest-checkout-user';
import { createPendingOrder } from '@/lib/payments/create-order';
import { startPaymentForOrder } from '@/lib/payments/start-payment';
import { eventAllowsUnverifiedIdPurchase } from '@/lib/event-purchase-eligibility';
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
    const parsed = checkoutSchema.parse(await request.json());
    const { items, promoCode, confirmAdult18, confirmIdAtDoor } = parsed;

    const session = await getSessionUser();
    let user;
    let forceIdOnlyCheckout = false;

    if (session) {
      user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
      purchaseLimit = getTicketLimitPerEvent(user);
      showLimitDetails = user.freeTicketsEnabled;

      if (!canPurchaseTickets(user)) {
        const slug = items[0]?.slug;
        const eventRow = slug
          ? await prisma.clubEvent.findFirst({
              where: { slug },
              select: { allowUnverifiedIdPurchase: true, isFreeEntry: true },
            })
          : null;
        if (!eventAllowsUnverifiedIdPurchase(eventRow)) {
          return NextResponse.json(
            {
              error:
                'Ticket purchase requires verified account. Wait for admin approval after registration.',
              code: 'NOT_VERIFIED',
            },
            { status: 403 },
          );
        }
        const hasHolderDetails = items.some((i) => (i.holders?.length ?? 0) > 0);
        if (hasHolderDetails && (!confirmAdult18 || !confirmIdAtDoor)) {
          return NextResponse.json(
            {
              error: 'Confirm age 18+ and that you will bring ID to the door.',
              code: 'ID_POLICY_REQUIRED',
            },
            { status: 400 },
          );
        }
      }
    } else {
      if (items.length !== 1 || items[0]!.qty !== 1) {
        return NextResponse.json(
          { error: 'Guest checkout supports one ticket at a time.', code: 'GUEST_CHECKOUT_INVALID' },
          { status: 400 },
        );
      }
      const slug = items[0]!.slug;
      const eventRow = await prisma.clubEvent.findFirst({
        where: { slug },
        select: { allowUnverifiedIdPurchase: true, isFreeEntry: true },
      });
      if (!eventAllowsUnverifiedIdPurchase(eventRow)) {
        return NextResponse.json(
          {
            error: 'Log in or register to buy tickets for this event.',
            code: 'LOGIN_REQUIRED',
          },
          { status: 401 },
        );
      }
      const holder = items[0]!.holders?.[0];
      if (!holder) {
        return NextResponse.json(
          { error: 'Enter ticket holder details.', code: 'HOLDER_REQUIRED' },
          { status: 400 },
        );
      }
      if (!confirmAdult18 || !confirmIdAtDoor) {
        return NextResponse.json(
          {
            error: 'Confirm age 18+ and that you will bring ID to the door.',
            code: 'ID_POLICY_REQUIRED',
          },
          { status: 400 },
        );
      }
      user = await findOrCreateUserForGuestCheckout(holder);
      forceIdOnlyCheckout = true;
      // So /payment/return can poll order status and ticket-success works after Flitt.
      await setSessionCookie(toSessionUser(user));
    }

    const order = await createPendingOrder(user, items, promoCode, confirmAdult18, {
      forceIdOnlyCheckout,
    });
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
          error: 'This event is free entry — use Invitations in your account, not checkout.',
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
    if (message === 'UNDERAGE') {
      return NextResponse.json(
        { error: 'Ticket holder must be 18 or older.', code: 'UNDERAGE' },
        { status: 400 },
      );
    }
    if (message === 'AGE_MISMATCH') {
      return NextResponse.json(
        {
          error: 'Age does not match the personal ID number. Check your details.',
          code: 'AGE_MISMATCH',
        },
        { status: 400 },
      );
    }
    if (message === 'ADULT_CONFIRM_REQUIRED') {
      return NextResponse.json(
        { error: 'Confirm that you are 18 or older.', code: 'ADULT_CONFIRM_REQUIRED' },
        { status: 400 },
      );
    }
    if (message === 'INVALID_PROMO') {
      return NextResponse.json(
        { error: 'Promo code is invalid or does not apply to this event.', code: 'INVALID_PROMO' },
        { status: 400 },
      );
    }
    if (message === 'PROMO_ZERO_TOTAL') {
      return NextResponse.json(
        { error: 'Discount would make the total zero — use a lower percentage.', code: 'PROMO_ZERO_TOTAL' },
        { status: 400 },
      );
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
