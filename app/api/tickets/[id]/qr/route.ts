import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { qrDataUrl } from '@/lib/qr';
import { qrExpiredMessage, loadTicketQrContext } from '@/lib/ticket-qr-access';
import { assertTicketQrAccess } from '@/lib/ticket-qr-guard';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireUser();
    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, userId: session.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const adminBypass = session.role === 'ADMIN';
    const ctx = await loadTicketQrContext(ticket, async (slug) => {
      const event = await prisma.clubEvent.findFirst({
        where: { slug },
        select: { eventDate: true },
      });
      return event?.eventDate;
    });

    try {
      assertTicketQrAccess(ctx, adminBypass);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'QR_EXPIRED';
      if (code === 'QR_EXPIRED') {
        return NextResponse.json(
          { error: qrExpiredMessage(), code: 'QR_EXPIRED' },
          { status: 410 },
        );
      }
      return NextResponse.json({ error: 'Ticket unavailable', code }, { status: 410 });
    }

    const dataUrl = await qrDataUrl(ticket.qrToken);
    return NextResponse.json({ dataUrl, qrToken: ticket.qrToken });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
