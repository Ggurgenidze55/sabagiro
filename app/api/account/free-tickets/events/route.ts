import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listPublishedEvents } from '@/lib/events';
import { canAccessFreeTicketForEvent } from '@/lib/free-entry-access';
import { canPurchaseTickets } from '@/lib/verification';

export async function GET() {
  try {
    const session = await requireUser();
    if (!canPurchaseTickets(session)) {
      return NextResponse.json({ events: [] });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
    const events = await listPublishedEvents();

    const eligible = events.filter((event) =>
      canAccessFreeTicketForEvent(user, {
        isFreeEntry: event.isFreeEntry,
        freeEntryAccess:
          (event as (typeof event & { freeEntryAccess?: 'ALL_VERIFIED' | 'INVITED_ONLY' }))
            .freeEntryAccess ?? 'INVITED_ONLY',
      }),
    );

    return NextResponse.json({
      events: eligible.map((e) => ({ slug: e.slug, title: e.title })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
