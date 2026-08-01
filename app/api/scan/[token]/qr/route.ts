import { NextResponse } from 'next/server';
import { isSabagiroAppUserAgent } from '@/lib/app-shell';
import { prisma } from '@/lib/db';
import { CLUB_COORDS_LABEL } from '@/lib/club-location';
import { qrPngBuffer } from '@/lib/qr';
import { qrExpiredMessage, loadTicketQrContext } from '@/lib/ticket-qr-access';
import { assertTicketQrAccess } from '@/lib/ticket-qr-guard';
import { ticketPassPngBuffer } from '@/lib/ticket-pass';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { token: string } };

/** Public QR PNG for ticket emails (token is the secret). Expires after event + retention. */
export async function GET(request: Request, { params }: Params) {
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

  const url = new URL(request.url);
  const download = url.searchParams.get('download') === '1';
  const ua = request.headers.get('user-agent') || '';
  const inNativeApp = isSabagiroAppUserAgent(ua);
  // WKWebView ignores attachment downloads; show inline so Save/Share works.
  const asAttachment = download && !inNativeApp && url.searchParams.get('inline') !== '1';
  const filename = `sabagiro-ticket-${ticket.id.slice(-8)}.png`;

  let png: Buffer;
  if (download) {
    const event = await prisma.clubEvent.findFirst({
      where: { slug: ticket.productSlug },
      select: {
        title: true,
        dayLabel: true,
        dateLabel: true,
        doorsOpen: true,
        lineup: true,
        tag: true,
        about: true,
      },
    });
    png = await ticketPassPngBuffer({
      qrToken: params.token,
      productName: ticket.productName,
      holderFirstName: ticket.holderFirstName,
      holderLastName: ticket.holderLastName,
      holderPersonalId: ticket.holderPersonalId,
      priceGel: ticket.priceGel,
      tierLabel: ticket.tierLabel,
      event: event
        ? { ...event, coordsLabel: CLUB_COORDS_LABEL }
        : { title: ticket.productName, coordsLabel: CLUB_COORDS_LABEL },
    });
  } else {
    png = await qrPngBuffer(params.token);
  }

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Content-Disposition': asAttachment
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`,
    },
  });
}
