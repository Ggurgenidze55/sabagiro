import { NextResponse } from 'next/server';
import { handleFlittCallback } from '@/lib/payments/complete-payment';
import { buildPaymentReturnUrl } from '@/lib/payments/config';
import { siteUrl } from '@/lib/site-url';
import {
  flittStatusToOutcome,
  parseFlittPayload,
  verifyFlittCallback,
} from '@/lib/payments/flitt/callback';

export const runtime = 'nodejs';

/** Flitt POST to response_url — fulfill when possible, then redirect to polling page. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const orderIdFromQuery = url.searchParams.get('orderId') ?? '';

  let payload: Record<string, unknown>;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    payload = parseFlittPayload(body) as Record<string, unknown>;
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries()) as Record<string, unknown>;
  }

  const orderId = String(payload.order_id || orderIdFromQuery || '');
  const returnUrl = new URL(orderId ? buildPaymentReturnUrl(orderId) : siteUrl('/payment/return'));

  // Browser return often carries the same signed fields as the server callback —
  // fulfill here so tickets are issued even if the webhook is delayed or the
  // customer has no session yet (guest checkout).
  const verified = verifyFlittCallback({ payload });
  if (verified.valid) {
    try {
      await handleFlittCallback(payload);
    } catch {
      // Still redirect — /payment/return will sync via status API.
    }
  }

  const outcome = flittStatusToOutcome(String(payload.order_status || ''));
  if (outcome === 'failed') {
    returnUrl.searchParams.set('failed', '1');
  } else if (outcome === 'succeeded') {
    returnUrl.searchParams.set('paid', '1');
  }

  return NextResponse.redirect(returnUrl, 303);
}
