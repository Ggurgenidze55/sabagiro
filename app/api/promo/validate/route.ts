import { NextResponse } from 'next/server';
import { resolvePromoCodeForEvent } from '@/lib/promo-codes';
import { promoValidateSchema } from '@/lib/validators';

/** Public — promo validity is not secret; needed for guest / unverified checkout on event page. */
export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ error: 'Could not validate promo' }, { status: 400 });
  }
}
