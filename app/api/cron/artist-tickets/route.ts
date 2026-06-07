import { NextResponse } from 'next/server';
import { runArtistPreEventTicketDispatch } from '@/lib/artist-tickets';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/** Vercel Cron — daily 20:00 Tbilisi (16:00 UTC): DJ list tickets 1 day before each marked event. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('[cron:artist-tickets] CRON_SECRET not set');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runArtistPreEventTicketDispatch();
    console.info('[cron:artist-tickets] done', result);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    console.error('[cron:artist-tickets]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
