import { NextResponse } from 'next/server';
import { artistDispatchWeekKey, runWeeklyArtistTicketDispatch } from '@/lib/artist-tickets';
import { requireAdmin } from '@/lib/auth';

/** Admin: run this week's artist ticket batch now (same logic as Thursday cron). */
export async function POST() {
  try {
    const admin = await requireAdmin();
    const result = await runWeeklyArtistTicketDispatch({
      weekKey: artistDispatchWeekKey(),
      createdByUserId: admin.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
