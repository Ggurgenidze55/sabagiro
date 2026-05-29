import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatScannedAt } from '@/lib/ticket-scan';
import { loadTicketQrContext } from '@/lib/ticket-qr-access';
import { isQrExpired } from '@/lib/ticket-qr-guard';

type Params = { params: { token: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const ticket = await prisma.ticket.findUnique({
      where: { qrToken: params.token },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (ticket.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Ticket is cancelled', code: 'CANCELLED' },
        { status: 400 },
      );
    }
    if (ticket.status === 'USED') {
      return NextResponse.json({
        ok: true,
        status: 'USED',
        alreadyScanned: true,
        scannedAt: ticket.scannedAt?.toISOString() ?? null,
        scannedAtLabel: formatScannedAt(ticket.scannedAt),
      });
    }

    const ctx = await loadTicketQrContext(ticket, async (slug) => {
      const event = await prisma.clubEvent.findFirst({
        where: { slug },
        select: { eventDate: true },
      });
      return event?.eventDate;
    });

    if (isQrExpired(ctx, Date.now(), false)) {
      return NextResponse.json(
        { error: 'QR expired — event has passed', code: 'QR_EXPIRED' },
        { status: 410 },
      );
    }

    const scannedAt = new Date();
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED', scannedAt },
    });

    return NextResponse.json({
      ok: true,
      status: 'USED',
      alreadyScanned: false,
      scannedAt: scannedAt.toISOString(),
      scannedAtLabel: formatScannedAt(scannedAt),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
