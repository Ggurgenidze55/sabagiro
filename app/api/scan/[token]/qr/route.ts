import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { qrPngBuffer } from '@/lib/qr';
import { qrExpiredMessage, loadTicketQrContext } from '@/lib/ticket-qr-access';
import { assertTicketQrAccess } from '@/lib/ticket-qr-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { token: string } };

/** Public QR PNG for ticket emails (token is the secret). Expires after event + retention. */
export async function GET(_request: Request, { params }: Params) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      qrToken: params.token,
      status: { not: 'CANCELLED' },
    },
  });

  if (!ticket) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ctx = await loadTicketQrContext(ticket, async (slug) => {
    const event = await prisma.clubEvent.findFirst({
      where: { slug },
      select: { eventDate: true },
    });
    return event?.eventDate;
  });
  try {
    assertTicketQrAccess(ctx, false);
  } catch (e) {
    if (e instanceof Error && e.message === 'QR_EXPIRED') {
      return new NextResponse(qrExpiredMessage(), { status: 410 });
    }
    return new NextResponse('Unavailable', { status: 410 });
  }

  const png = await qrPngBuffer(params.token);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
