import { createHmac, timingSafeEqual } from 'node:crypto';
import { TBC_CALLBACK_IPS } from '@/lib/payments/tbc/constants';
import { isTbcSandbox } from '@/lib/payments/config';

function normalizeHmacSignature(sig: string): string {
  return sig.replace(/^sha256=/i, '').trim();
}

export function verifyTbcWebhook(opts: {
  rawBody: string;
  signature: string;
  secret: string;
  clientIp?: string;
  skipIpCheck?: boolean;
}): { valid: true; paymentId: string; payload: unknown } | { valid: false; error: string } {
  const { rawBody, signature, secret } = opts;
  const skipIp =
    opts.skipIpCheck ??
    (isTbcSandbox() || process.env.NODE_ENV === 'development');

  if (!skipIp && opts.clientIp) {
    if (!TBC_CALLBACK_IPS.includes(opts.clientIp as (typeof TBC_CALLBACK_IPS)[number])) {
      return { valid: false, error: 'Invalid source IP' };
    }
  }

  if (!secret) {
    return { valid: false, error: 'TBC webhook secret not configured' };
  }
  if (!signature) {
    return { valid: false, error: 'Missing webhook signature' };
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = normalizeHmacSignature(signature);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, error: 'Invalid HMAC signature' };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { valid: false, error: 'Invalid JSON body' };
  }

  const paymentId =
    (payload.PaymentId as string) ||
    (payload.paymentId as string) ||
    (payload.payId as string) ||
    '';

  if (!paymentId) {
    return { valid: false, error: 'Missing PaymentId in callback' };
  }

  return { valid: true, paymentId, payload };
}
