import { NextResponse } from 'next/server';
import { runArtistPreEventTicketDispatch } from '@/lib/artist-tickets';
import { requireAdmin } from '@/lib/auth';

/** Admin: send DJ list tickets for events happening tomorrow (same as daily cron). */
export async function POST() {
  try {
    const admin = await requireAdmin();
    const result = await runArtistPreEventTicketDispatch({
      createdByUserId: admin.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
