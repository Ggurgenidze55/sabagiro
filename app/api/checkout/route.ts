import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { createTicketForUser } from '@/lib/tickets';
import { checkoutSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
    const { items } = checkoutSchema.parse(await request.json());

    const tickets = [];
    for (const item of items) {
      const product = await getProduct(item.slug);
      if (!product || product.type !== 'ticket') continue;
      for (let i = 0; i < item.qty; i++) {
        const ticket = await createTicketForUser({
          user,
          productSlug: product.slug,
          source: 'PURCHASE',
        });
        tickets.push(ticket);
      }
    }

    if (tickets.length === 0) {
      return NextResponse.json({ error: 'No valid tickets in cart' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ticketIds: tickets.map((t) => t.id) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout failed';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
