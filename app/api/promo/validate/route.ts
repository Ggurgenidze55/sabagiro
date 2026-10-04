import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { resolvePromoCodeForEvent } from '@/lib/promo-codes';
import { promoValidateSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    await requireUser();
    const { code, slug } = promoValidateSchema.parse(await request.json());
    const resolved = await resolvePromoCodeForEvent(code, slug);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired promo for this event.' });
    }
    return NextResponse.json({
      ok: true,
      percentOff: resolved.percentOff,
      code: resolved.row.code,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Could not validate promo' }, { status: 400 });
  }
}
