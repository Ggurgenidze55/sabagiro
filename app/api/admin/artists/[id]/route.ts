import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { artistUpdateSchema, formatValidationError } from '@/lib/validators';
import { findOrCreateUserForAdmin } from '@/lib/tickets';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = artistUpdateSchema.parse(await request.json());
    const existing = await prisma.artist.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const email = body.email ?? existing.email;
    const phone = body.phone ?? existing.phone;
    const firstName = body.firstName ?? existing.firstName;
    const lastName = body.lastName ?? existing.lastName;
    const personalId = body.personalId ?? existing.personalId;

    const user = await findOrCreateUserForAdmin({
      email,
      phone,
      firstName,
      lastName,
      personalId,
    });

    const artist = await prisma.artist.update({
      where: { id: params.id },
      data: {
        stageName: body.stageName !== undefined ? body.stageName.trim() : undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        personalId: body.personalId,
        email: body.email,
        phone: body.phone,
        instagramUrl: body.instagramUrl !== undefined ? body.instagramUrl.trim() : undefined,
        active: body.active,
        weeklyTickets: body.weeklyTickets,
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true, artist });
  } catch (e) {
    const message = formatValidationError(e);
    const status =
      e instanceof Error && e.message === 'UNAUTHORIZED'
        ? 401
        : e instanceof Error && e.message === 'FORBIDDEN'
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const existing = await prisma.artist.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.artist.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
