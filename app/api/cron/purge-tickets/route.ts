import { NextResponse } from 'next/server';
import { purgeExpiredTickets } from '@/lib/purge-expired-tickets';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/** Vercel Cron — daily 02:00 Tbilisi (22:00 UTC): purge VALID/USED tickets 4+ days after event. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('[cron:purge-tickets] CRON_SECRET not set');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await purgeExpiredTickets();
    console.info('[cron:purge-tickets] done', result);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    console.error('[cron:purge-tickets]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
