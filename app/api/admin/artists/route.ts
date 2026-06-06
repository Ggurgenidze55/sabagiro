import { NextResponse } from 'next/server';
import { artistDisplayName } from '@/lib/artist-tickets';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendArtistRosterAddedEmail } from '@/lib/email/send';
import { artistSchema, formatValidationError } from '@/lib/validators';
import { findOrCreateUserForAdmin } from '@/lib/tickets';

export async function GET() {
  try {
    await requireAdmin();
    const artists = await prisma.artist.findMany({
      orderBy: [{ stageName: 'asc' }, { lastName: 'asc' }],
      include: {
        _count: { select: { dispatches: true } },
      },
    });

    return NextResponse.json({
      artists: artists.map((a) => ({
        id: a.id,
        stageName: a.stageName,
        displayName: artistDisplayName(a),
        firstName: a.firstName,
        lastName: a.lastName,
        personalId: a.personalId,
        email: a.email,
        phone: a.phone,
        instagramUrl: a.instagramUrl,
        active: a.active,
        weeklyTickets: a.weeklyTickets,
        dispatchCount: a._count.dispatches,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = artistSchema.parse(await request.json());

    const user = await findOrCreateUserForAdmin({
      email: body.email,
      phone: body.phone,
      firstName: body.firstName,
      lastName: body.lastName,
      personalId: body.personalId,
    });

    const artist = await prisma.artist.create({
      data: {
        stageName: body.stageName?.trim() ?? '',
        firstName: body.firstName,
        lastName: body.lastName,
        personalId: body.personalId,
        email: body.email,
        phone: body.phone,
        instagramUrl: body.instagramUrl?.trim() ?? '',
        active: body.active ?? true,
        weeklyTickets: body.weeklyTickets ?? true,
        userId: user.id,
      },
    });

    const email = await sendArtistRosterAddedEmail({
      to: artist.email,
      firstName: artist.firstName,
      displayName: artistDisplayName(artist),
      weeklyTickets: artist.weeklyTickets,
    });

    if (!email.sent) {
      console.error('[artist] roster email failed', {
        artistId: artist.id,
        to: artist.email,
        error: email.error,
        skipped: email.skipped,
      });
    }

    return NextResponse.json({ ok: true, artist, email });
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
