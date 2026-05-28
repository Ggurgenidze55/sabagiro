/** Sabagiro payments — independent of LariPay SaaS. */

function readEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : fallback;
}

export function isTbcSandbox(): boolean {
  return readEnv('TBC_ENV', 'sandbox').toLowerCase() === 'sandbox';
}

export function getTbcApiOrigin(): string {
  return isTbcSandbox()
    ? 'https://test-api.tbcbank.ge/v1'
    : 'https://api.tbcbank.ge/v1';
}

export function getPublicBaseUrl(): string {
  const fromEnv =
    readEnv('SABAGIRO_PUBLIC_URL') ||
    readEnv('NEXT_PUBLIC_APP_URL') ||
    readEnv('VERCEL_URL', '');
  if (!fromEnv) return 'http://localhost:3001';
  if (fromEnv.startsWith('http')) return fromEnv.replace(/\/$/, '');
  return `https://${fromEnv.replace(/\/$/, '')}`;
}

export function buildPaymentReturnUrl(orderId: string): string {
  const base = getPublicBaseUrl();
  return `${base}/payment/return?orderId=${encodeURIComponent(orderId)}`;
}

export function buildTbcWebhookUrl(): string {
  const override = readEnv('TBC_CALLBACK_URL');
  if (override) return override;
  return `${getPublicBaseUrl()}/api/webhooks/tbc`;
}

export function isPaymentsTestMode(): boolean {
  const flag = readEnv('SABAGIRO_PAYMENTS_TEST_MODE').toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'yes') return true;
  if (flag === '0' || flag === 'false' || flag === 'no') return false;
  const hasTbc =
    Boolean(readEnv('TBC_CLIENT_ID')) && Boolean(readEnv('TBC_CLIENT_SECRET'));
  return !hasTbc;
}

export function getTbcConfig() {
  return {
    clientId: readEnv('TBC_CLIENT_ID'),
    clientSecret: readEnv('TBC_CLIENT_SECRET'),
    apiKey: readEnv('TBC_API_KEY'),
    webhookSecret: readEnv('TBC_WEBHOOK_SECRET') || readEnv('TBC_CLIENT_SECRET'),
    sandbox: isTbcSandbox(),
    origin: getTbcApiOrigin(),
  };
}

export const ORDER_TTL_MINUTES = 30;
