import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createTicketForUser, findOrCreateUserForAdmin } from '@/lib/tickets';
import { adminGenerateSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = adminGenerateSchema.parse(await request.json());
    const user = await findOrCreateUserForAdmin({
      email: body.email,
      phone: body.phone,
      firstName: body.firstName,
      lastName: body.lastName,
      personalId: body.personalId,
    });

    const ticket = await createTicketForUser({
      user,
      productSlug: body.productSlug,
      source: 'ADMIN',
      createdByUserId: admin.id,
      priceGel: 0,
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
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
