import { buildTbcWebhookUrl, getTbcConfig } from '@/lib/payments/config';
import { siteUrl } from '@/lib/site-url';
import { TBC_CURRENCY, TBC_PATHS } from '@/lib/payments/tbc/constants';

export type TbcCreateResult = {
  paymentId: string;
  status: string;
  redirectUrl: string | null;
  raw: unknown;
};

export class TbcClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly cfg = getTbcConfig(),
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.token;
    }

    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (this.cfg.apiKey) headers.apikey = this.cfg.apiKey;

    const res = await this.fetchFn(`${this.cfg.origin}${TBC_PATHS.TOKEN}`, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TBC OAuth failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    this.token = data.access_token ?? '';
    this.tokenExpiresAt = Date.now() + (Number(data.expires_in) || 86400) * 1000;
    return this.token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    if (this.cfg.apiKey) headers.apikey = this.cfg.apiKey;

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const res = await this.fetchFn(`${this.cfg.origin}${path}`, init);
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const msg =
        (data.developerMessage as string) ||
        (data.userMessage as string) ||
        JSON.stringify(data);
      throw new Error(`TBC API error (${res.status}): ${msg}`);
    }

    return data as T;
  }

  async createPayment(opts: {
    amountGel: number;
    orderId: string;
    returnUrl?: string;
    description?: string;
  }): Promise<TbcCreateResult> {
    const payload: Record<string, unknown> = {
      amount: {
        currency: TBC_CURRENCY,
        total: opts.amountGel,
      },
      returnurl:
        opts.returnUrl ??
        siteUrl(`/payment/return?orderId=${encodeURIComponent(opts.orderId)}`),
      merchantPaymentId: String(opts.orderId),
      language: 'EN',
      preAuth: false,
      callbackUrl: buildTbcWebhookUrl(),
    };
    if (opts.description) payload.description = opts.description;

    const data = await this.request<{
      payId?: string;
      status?: string;
      links?: { rel?: string; uri?: string }[];
    }>('POST', TBC_PATHS.PAYMENTS, payload);

    const redirectUrl =
      (data.links ?? []).find((l) => l.rel === 'approval_url')?.uri ?? null;

    return {
      paymentId: data.payId ?? '',
      status: data.status ?? '',
      redirectUrl,
      raw: data,
    };
  }

  async checkStatus(payId: string): Promise<{ status: string; raw: unknown }> {
    const data = await this.request<{ status?: string; payId?: string }>(
      'GET',
      `${TBC_PATHS.PAYMENTS}/${encodeURIComponent(payId)}`,
    );
    return { status: data.status ?? '', raw: data };
  }
}
