import { getFlittConfig, gelToFlittMinorUnits } from '@/lib/payments/config';
import { buildFlittSignature } from '@/lib/payments/flitt/signature';
import { FLITT_API_PATHS, FLITT_ORDER_APPROVED, FLITT_FAILED_STATUSES } from '@/lib/payments/flitt/constants';

type FlittRequestBody = Record<string, string | number>;

export class FlittClient {
  private cfg = getFlittConfig();
  private fetchFn: typeof fetch;

  constructor(fetchFn: typeof fetch = fetch) {
    this.fetchFn = fetchFn;
  }

  private signedRequest(params: FlittRequestBody): FlittRequestBody {
    const signature = buildFlittSignature(this.cfg.secretKey, {
      ...params,
      merchant_id: this.cfg.merchantId,
    });
    return { ...params, merchant_id: this.cfg.merchantId, signature };
  }

  private async post<T>(path: string, requestParams: FlittRequestBody): Promise<T> {
    const request = this.signedRequest(requestParams);
    const res = await this.fetchFn(`${this.cfg.apiOrigin}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      response?: T & { response_status?: string; error_message?: string; error_code?: number };
    };

    const response = data.response;
    if (!response || (response as { response_status?: string }).response_status === 'failure') {
      const msg =
        (response as { error_message?: string })?.error_message ||
        `Flitt API error (${res.status})`;
      throw new Error(msg);
    }

    return response as T;
  }

  async createCheckout(opts: {
    orderId: string;
    amountGel: number;
    description: string;
    responseUrl: string;
    serverCallbackUrl: string;
  }) {
    const params: FlittRequestBody = {
      version: '1.0.1',
      order_id: opts.orderId,
      order_desc: opts.description.slice(0, 1024),
      amount: gelToFlittMinorUnits(opts.amountGel),
      currency: 'GEL',
      response_url: opts.responseUrl,
      server_callback_url: opts.serverCallbackUrl,
      delayed: 'N',
    };

    const response = await this.post<{
      checkout_url?: string;
      payment_id?: string | number;
    }>(FLITT_API_PATHS.CHECKOUT_URL, params);

    if (!response.checkout_url) {
      throw new Error('Flitt did not return checkout_url');
    }

    return {
      redirectUrl: response.checkout_url,
      paymentId: response.payment_id != null ? String(response.payment_id) : opts.orderId,
      raw: response,
    };
  }

  async getOrderStatus(orderId: string) {
    const response = await this.post<{
      order_status?: string;
      payment_id?: string | number;
    }>(FLITT_API_PATHS.ORDER_STATUS, {
      version: '1.0.1',
      order_id: orderId,
    });

    const status = String(response.order_status || '').toLowerCase();
    if (status === FLITT_ORDER_APPROVED) return { status: 'succeeded' as const, raw: response };
    if (FLITT_FAILED_STATUSES.has(status)) return { status: 'failed' as const, raw: response };
    return { status: 'pending' as const, raw: response };
  }
}
