import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createFreeTicketForVerifiedUser } from '@/lib/tickets';
import { freeTicketsRemaining } from '@/lib/ticket-purchase-limit';
import { canPurchaseTickets } from '@/lib/verification';
import { formatValidationError, freeTicketGenerateSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

    if (!canPurchaseTickets(user)) {
      return NextResponse.json(
        { error: 'უფასო ბილეთები მხოლოდ ვერიფიცირებულ ანგარიშზე.', code: 'NOT_VERIFIED' },
        { status: 403 },
      );
    }

    if (freeTicketsRemaining(user) <= 0) {
      return NextResponse.json(
        { error: 'უფასო ბილეთების ლიმიტი ამოიწურა.', code: 'NO_FREE_TICKETS' },
        { status: 409 },
      );
    }

    const body = freeTicketGenerateSchema.parse(await request.json());

    const ticket = await createFreeTicketForVerifiedUser({
      owner: user,
      productSlug: body.productSlug,
      holder: {
        firstName: body.firstName,
        lastName: body.lastName,
        personalId: body.personalId,
        email: body.email,
        phone: body.phone,
      },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'NO_FREE_TICKETS') {
      return NextResponse.json(
        { error: 'უფასო ბილეთების ლიმიტი ამოიწურა.', code: 'NO_FREE_TICKETS' },
        { status: 409 },
      );
    }
    if (message === 'INVALID_PRODUCT') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    return NextResponse.json({ error: formatValidationError(e) }, { status: 400 });
  }
}
