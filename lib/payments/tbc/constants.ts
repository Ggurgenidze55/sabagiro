export const TBC_CURRENCY = 'GEL';

export const TBC_PATHS = {
  TOKEN: '/tpay/access-token',
  PAYMENTS: '/tpay/payments',
} as const;

export const TBC_CALLBACK_IPS = [
  '193.104.20.44',
  '193.104.20.45',
  '185.52.80.44',
  '185.52.80.45',
] as const;

export const TBC_STATUS_SUCCEEDED = 'Succeeded';
export const TBC_STATUS_FAILED = 'Failed';
