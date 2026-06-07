import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { listPublishedEvents } from '@/lib/events';
import { canPurchaseTickets } from '@/lib/verification';

export async function GET() {
  try {
    const session = await requireUser();
    if (!session.freeTicketsEnabled || !canPurchaseTickets(session)) {
      return NextResponse.json({ events: [] });
    }

    const events = await listPublishedEvents();
    return NextResponse.json({
      events: events.map((e) => ({ slug: e.slug, title: e.title })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
