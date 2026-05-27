import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
      return NextResponse.json({ error: 'Ticket is cancelled' }, { status: 400 });
    }
    if (ticket.status === 'USED') {
      return NextResponse.json({ ok: true, status: 'USED' });
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED' },
    });

    return NextResponse.json({ ok: true, status: 'USED' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
