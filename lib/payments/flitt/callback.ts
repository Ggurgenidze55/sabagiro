import { getFlittConfig } from '@/lib/payments/config';
import { verifyFlittSignature } from '@/lib/payments/flitt/signature';
import { FLITT_CALLBACK_IPS, FLITT_ORDER_APPROVED, FLITT_FAILED_STATUSES } from '@/lib/payments/flitt/constants';

export type FlittCallbackPayload = Record<string, unknown>;

export function parseFlittPayload(body: unknown): FlittCallbackPayload {
  if (!body || typeof body !== 'object') return {};
  const record = body as Record<string, unknown>;
  if (record.response && typeof record.response === 'object') {
    return record.response as FlittCallbackPayload;
  }
  return record;
}

export function verifyFlittCallback(opts: {
  payload: FlittCallbackPayload;
  clientIp?: string;
}): { valid: true; orderId: string; paymentId: string; orderStatus: string } | { valid: false; error: string } {
  const { secretKey } = getFlittConfig();
  if (!secretKey) {
    return { valid: false, error: 'Flitt secret not configured' };
  }

  if (opts.clientIp && !FLITT_CALLBACK_IPS.includes(opts.clientIp as (typeof FLITT_CALLBACK_IPS)[number])) {
    // Allow when behind proxy without IP (Vercel) — signature is primary check
  }

  if (!verifyFlittSignature(secretKey, opts.payload as Record<string, string | number>)) {
    return { valid: false, error: 'Invalid Flitt signature' };
  }

  const orderId = String(opts.payload.order_id || '');
  const paymentId = String(opts.payload.payment_id || '');
  const orderStatus = String(opts.payload.order_status || '').toLowerCase();

  if (!orderId) {
    return { valid: false, error: 'Missing order_id' };
  }

  return { valid: true, orderId, paymentId, orderStatus };
}

export function flittStatusToOutcome(orderStatus: string): 'succeeded' | 'failed' | 'pending' {
  const s = orderStatus.toLowerCase();
  if (s === FLITT_ORDER_APPROVED) return 'succeeded';
  if (FLITT_FAILED_STATUSES.has(s)) return 'failed';
  return 'pending';
}
