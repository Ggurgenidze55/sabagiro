import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  adminInvitationHolder,
  nextAdminGuestNumberFromLastNames,
} from '@/lib/invitation';
import { createTicketForUser, findOrCreateUserForAdmin } from '@/lib/tickets';
import { adminGenerateSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = adminGenerateSchema.parse(await request.json());
    const guest = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
    };

    const user = await findOrCreateUserForAdmin({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    const existing = await prisma.ticket.findMany({
      where: {
        productSlug: body.productSlug,
        status: { not: 'CANCELLED' },
        holderEmail: { equals: body.email.trim(), mode: 'insensitive' },
      },
      select: { holderLastName: true },
    });

    const startNumber = nextAdminGuestNumberFromLastNames(
      existing.map((t) => t.holderLastName),
    );
    const useGuestSuffix = existing.length > 0 || body.quantity > 1;

    const tickets = [];
    const emails = [];
    const guestNumbers: number[] = [];

    for (let i = 0; i < body.quantity; i++) {
      const guestNumber = startNumber + i;
      guestNumbers.push(guestNumber);
      const holder = adminInvitationHolder(guest, guestNumber, { useGuestSuffix });

      const result = await createTicketForUser({
        user,
        productSlug: body.productSlug,
        source: 'ADMIN',
        createdByUserId: admin.id,
        priceGel: 0,
        holder,
      });

      tickets.push(result.ticket);
      emails.push(result.email);
    }

    const emailsSent = emails.filter((e) => e.sent).length;

    return NextResponse.json({
      ok: true,
      quantity: body.quantity,
      emailsSent,
      guestNumbers: useGuestSuffix ? guestNumbers : [],
      ticket: tickets[0],
      email: emails[0],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
