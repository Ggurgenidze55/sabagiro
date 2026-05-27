import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { qrDataUrl } from '@/lib/qr';

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
    const dataUrl = await qrDataUrl(ticket.qrToken);
    return NextResponse.json({ dataUrl, qrToken: ticket.qrToken });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
