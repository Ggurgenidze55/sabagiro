import type { Order } from '@prisma/client';
import { prisma } from '@/lib/db';
import { isPaymentsTestMode } from '@/lib/payments/config';
import { siteUrl } from '@/lib/site-url';
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
        redirectUrl: siteUrl(`/payment/test?orderId=${order.id}`),
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
    returnUrl: siteUrl(`/payment/return?orderId=${encodeURIComponent(order.id)}`),
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
