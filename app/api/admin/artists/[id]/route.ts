import { NextResponse } from 'next/server';
import { artistDisplayName } from '@/lib/artist-tickets';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendArtistRosterRemovedEmail } from '@/lib/email/send';
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

    const email = await sendArtistRosterRemovedEmail({
      to: existing.email,
      firstName: existing.firstName,
      displayName: artistDisplayName(existing),
    });

    await prisma.artist.delete({ where: { id: params.id } });

    if (!email.sent) {
      console.error('[artist] roster removal email failed', {
        artistId: existing.id,
        to: existing.email,
        error: email.error,
        skipped: email.skipped,
      });
    }

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
