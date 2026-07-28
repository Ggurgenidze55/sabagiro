import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createTicketForUser, findOrCreateUserForAdmin } from '@/lib/tickets';
import { adminInvitationHolder } from '@/lib/invitation';
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

    const tickets = [];
    const emails = [];

    for (let i = 1; i <= body.quantity; i++) {
      const holder = adminInvitationHolder(guest, i, body.quantity);

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
