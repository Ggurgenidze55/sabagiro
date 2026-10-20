import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { cancelTicketById } from '@/lib/cancel-ticket';

type Params = { params: { id: string } };

/** Admin — cancel ticket after refund so door QR is invalid. */
export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdmin();

    const result = await cancelTicketById(params.id);
    return NextResponse.json({
      ok: true,
      alreadyCancelled: result.alreadyCancelled,
      ticket: {
        id: result.ticket.id,
        status: result.ticket.status,
        productName: result.ticket.productName,
        holderEmail: result.ticket.holderEmail,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === 'TICKET_NOT_FOUND') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
