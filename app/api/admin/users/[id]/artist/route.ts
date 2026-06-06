import { NextResponse } from 'next/server';
import { artistDisplayName } from '@/lib/artist-tickets';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendArtistRosterAddedEmail } from '@/lib/email/send';

type Params = { params: { id: string } };

function artistPayload(artist: {
  id: string;
  stageName: string;
  firstName: string;
  lastName: string;
  active: boolean;
}) {
  return {
    artistId: artist.id,
    isArtist: true,
    artistLabel: artistDisplayName(artist),
    artistActive: artist.active,
  };
}

/** Add an existing user to the DJ / artist roster. */
export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts cannot be added to the artist list' }, { status: 400 });
    }

    const existing = await prisma.artist.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
    });
    if (existing) {
      if (existing.userId !== user.id) {
        const linked = await prisma.artist.update({
          where: { id: existing.id },
          data: { userId: user.id },
        });
        return NextResponse.json({ ok: true, ...artistPayload(linked) });
      }
      return NextResponse.json({ error: 'User is already on the artist list' }, { status: 409 });
    }

    const artist = await prisma.artist.create({
      data: {
        stageName: '',
        firstName: user.firstName,
        lastName: user.lastName,
        personalId: user.personalId,
        email: user.email,
        phone: user.phone,
        instagramUrl: user.instagramUrl,
        active: true,
        weeklyTickets: true,
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

    return NextResponse.json({
      ok: true,
      ...artistPayload(artist),
      email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Remove user from the DJ / artist roster. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const artist = await prisma.artist.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
    });
    if (!artist) {
      return NextResponse.json({ error: 'User is not on the artist list' }, { status: 404 });
    }

    await prisma.artist.delete({ where: { id: artist.id } });

    return NextResponse.json({
      ok: true,
      artistId: null,
      isArtist: false,
      artistLabel: null,
      artistActive: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
