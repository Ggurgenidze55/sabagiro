import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { createTicketForUser } from '@/lib/tickets';
import { allocateTierPrices, getEventTierAvailability } from '@/lib/ticket-tiers';
import {
  getTicketLimitPerEvent,
  purchaseLimitApplies,
  remainingPurchaseSlots,
  ticketAlreadyOwnedMessage,
  ticketLimitMessage,
} from '@/lib/ticket-purchase-limit';
import { canPurchaseTickets } from '@/lib/verification';
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
    const tickets = [];

    for (const item of items) {
      const product = await getProduct(item.slug);
      if (!product || product.type !== 'ticket') continue;

      if (purchaseLimitApplies(user)) {
        const remaining = await remainingPurchaseSlots(user, item.slug);
        if (item.qty > remaining) {
          return NextResponse.json(
            {
              error:
                remaining <= 0
                  ? showLimitDetails
                    ? ticketAlreadyOwnedMessage(purchaseLimit)
                    : 'Ticket purchase is currently unavailable. Please contact support.'
                  : showLimitDetails
                    ? ticketLimitMessage(purchaseLimit)
                    : 'Ticket quantity could not be processed. Please contact support.',
              code: remaining <= 0 ? 'ALREADY_OWNED' : 'TICKET_LIMIT',
            },
            { status: remaining <= 0 ? 409 : 400 },
          );
        }
      }

      const batch = await prisma.$transaction(async () => {
        if (purchaseLimitApplies(user)) {
          const remaining = await remainingPurchaseSlots(user, item.slug);
          if (item.qty > remaining) {
            throw new Error(remaining <= 0 ? 'ALREADY_OWNED' : 'TICKET_LIMIT');
          }
        }

        const avail = await getEventTierAvailability(item.slug);
        if (!avail || avail.totalRemaining < item.qty) {
          throw new Error('SOLD_OUT');
        }

        const { prices, labels } = allocateTierPrices(avail.tiers, item.qty);
        const created = [];

        for (let i = 0; i < item.qty; i++) {
          const holder = i === 0 ? undefined : item.holders?.[i - 1];
          if (i > 0 && !holder) {
            throw new Error('HOLDER_REQUIRED');
          }
          const ticket = await createTicketForUser({
            user,
            productSlug: item.slug,
            source: 'PURCHASE',
            priceGel: prices[i],
            tierLabel: labels[i],
            createdByUserId: user.id,
            holder,
          });
          created.push(ticket);
        }

        return created;
      });

      tickets.push(...batch);
    }

    if (tickets.length === 0) {
      return NextResponse.json({ error: 'No valid tickets in cart' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ticketIds: tickets.map((t) => t.id) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'SOLD_OUT') {
      return NextResponse.json({ error: 'Not enough tickets left for this event' }, { status: 409 });
    }
    if (message === 'HOLDER_REQUIRED') {
      return NextResponse.json(
        { error: 'Please provide full holder details for each additional ticket.', code: 'HOLDER_REQUIRED' },
        { status: 400 },
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
