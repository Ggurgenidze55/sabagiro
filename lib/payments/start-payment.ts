import type { Order } from '@prisma/client';
import { prisma } from '@/lib/db';
import { buildFlittWebhookUrl, buildPaymentReturnUrl, isPaymentsTestMode } from '@/lib/payments/config';
import { siteUrl } from '@/lib/site-url';
import { FlittClient } from '@/lib/payments/flitt/client';

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

  const client = new FlittClient();
  const result = await client.createCheckout({
    orderId: order.id,
    amountGel: order.totalGel,
    description: `SABAGIRO tickets · ${order.totalGel} GEL`,
    responseUrl: buildPaymentReturnUrl(order.id),
    serverCallbackUrl: buildFlittWebhookUrl(),
  });

  if (!result.redirectUrl) {
    throw new Error('FLITT_NO_REDIRECT');
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: 'FLITT',
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
