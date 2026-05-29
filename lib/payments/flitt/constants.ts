/** https://docs.flitt.com/api/callbacks/ */
export const FLITT_CALLBACK_IPS = ['54.154.216.60', '3.75.125.89'] as const;

export const FLITT_API_PATHS = {
  CHECKOUT_URL: '/api/checkout/url',
  ORDER_STATUS: '/api/status/order_id',
} as const;

export const FLITT_ORDER_APPROVED = 'approved';
export const FLITT_ORDER_DECLINED = 'declined';
export const FLITT_ORDER_EXPIRED = 'expired';
export const FLITT_ORDER_REJECTED = 'rejected';

export const FLITT_FAILED_STATUSES = new Set([
  FLITT_ORDER_DECLINED,
  FLITT_ORDER_EXPIRED,
  FLITT_ORDER_REJECTED,
]);
