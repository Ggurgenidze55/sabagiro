/** Sabagiro payments — Flitt (https://docs.flitt.com/) */

import { getSiteBaseUrl, siteUrl } from '@/lib/site-url';

function readEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : fallback;
}

export function getPublicBaseUrl(): string {
  return getSiteBaseUrl();
}

export function buildPaymentReturnUrl(orderId: string): string {
  return siteUrl(`/payment/return?orderId=${encodeURIComponent(orderId)}`);
}

export function buildFlittWebhookUrl(): string {
  const override = readEnv('FLITT_CALLBACK_URL');
  if (override) return override;
  return siteUrl('/api/webhooks/flitt');
}

/** Whole GEL (45) → Flitt minor units (4500 tetri). */
export function gelToFlittMinorUnits(amountGel: number): number {
  return Math.round(amountGel * 100);
}

export function isPaymentsTestMode(): boolean {
  const flag = readEnv('SABAGIRO_PAYMENTS_TEST_MODE').toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'yes') return true;
  if (flag === '0' || flag === 'false' || flag === 'no') return false;
  const hasFlitt =
    Boolean(readEnv('FLITT_MERCHANT_ID')) && Boolean(readEnv('FLITT_SECRET_KEY'));
  return !hasFlitt;
}

export function getFlittConfig() {
  return {
    merchantId: Number(readEnv('FLITT_MERCHANT_ID', '0')),
    secretKey: readEnv('FLITT_SECRET_KEY'),
    apiOrigin: readEnv('FLITT_API_ORIGIN', 'https://pay.flitt.com').replace(/\/$/, ''),
  };
}

export const ORDER_TTL_MINUTES = 30;
