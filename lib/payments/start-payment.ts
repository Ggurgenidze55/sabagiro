import type { Order } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  buildPaymentReturnUrl,
  getPublicBaseUrl,
  isPaymentsTestMode,
} from '@/lib/payments/config';
import { TbcClient } from '@/lib/payments/tbc/client';

export async function startPaymentForOrder(order: Order) {
  if (order.status !== 'PENDING') {
    throw new Error('ORDER_NOT_PENDING');
  }
  if (order.expiresAt && order.expiresAt < new Date()) {
    throw new Error('ORDER_EXPIRED');
  }

  if (isPaymentsTestMode()) {
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'TEST',
        amountGel: order.totalGel,
        redirectUrl: `${getPublicBaseUrl()}/payment/test?orderId=${order.id}`,
      },
    });
    return {
      paymentId: payment.id,
      redirectUrl: payment.redirectUrl,
      testMode: true as const,
    };
  }

  const client = new TbcClient();
  const result = await client.createPayment({
    amountGel: order.totalGel,
    orderId: order.id,
    returnUrl: buildPaymentReturnUrl(order.id),
    description: `SABAGIRO tickets · ${order.totalGel} GEL`,
  });

  if (!result.redirectUrl || !result.paymentId) {
    throw new Error('TBC_NO_REDIRECT');
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: 'TBC',
      amountGel: order.totalGel,
      bankPaymentId: result.paymentId,
      redirectUrl: result.redirectUrl,
      rawCreate: result.raw as object,
    },
  });

  return {
    paymentId: payment.id,
    redirectUrl: result.redirectUrl,
    testMode: false as const,
  };
}
