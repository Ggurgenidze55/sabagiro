import { NextResponse } from 'next/server';
import { buildPaymentReturnUrl } from '@/lib/payments/config';
import { siteUrl } from '@/lib/site-url';
import { flittStatusToOutcome, parseFlittPayload } from '@/lib/payments/flitt/callback';

export const runtime = 'nodejs';

/** Flitt POST redirect to response_url after customer pays. */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    payload = parseFlittPayload(body) as Record<string, unknown>;
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries()) as Record<string, unknown>;
  }

  const orderId = String(payload.order_id || '');
  const url = new URL(orderId ? buildPaymentReturnUrl(orderId) : siteUrl('/payment/return'));

  const outcome = flittStatusToOutcome(String(payload.order_status || ''));
  if (outcome === 'failed') {
    url.searchParams.set('failed', '1');
  } else if (outcome === 'succeeded') {
    url.searchParams.set('paid', '1');
  }

  return NextResponse.redirect(url, 303);
}
