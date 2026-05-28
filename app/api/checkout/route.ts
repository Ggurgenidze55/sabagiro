import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { createTicketForUser } from '@/lib/tickets';
import { allocateTierPrices, getEventTierAvailability } from '@/lib/ticket-tiers';
import { canPurchaseTickets } from '@/lib/verification';
import { checkoutSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

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

      const batch = await prisma.$transaction(async () => {
        const avail = await getEventTierAvailability(item.slug);
        if (!avail || avail.totalRemaining < item.qty) {
          throw new Error('SOLD_OUT');
        }

        const { prices, labels } = allocateTierPrices(avail.tiers, item.qty);
        const created = [];

        for (let i = 0; i < item.qty; i++) {
          const ticket = await createTicketForUser({
            user,
            productSlug: item.slug,
            source: 'PURCHASE',
            priceGel: prices[i],
            tierLabel: labels[i],
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
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
