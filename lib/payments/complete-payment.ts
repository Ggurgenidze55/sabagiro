import { prisma } from '@/lib/db';
import { fulfillPaidOrder, markOrderFailed } from '@/lib/payments/fulfill-order';
import { TbcClient } from '@/lib/payments/tbc/client';
import { TBC_STATUS_FAILED, TBC_STATUS_SUCCEEDED } from '@/lib/payments/tbc/constants';
import { isPaymentsTestMode } from '@/lib/payments/config';

export async function completePaymentSuccess(paymentId: string, rawCallback?: unknown) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw new Error('PAYMENT_NOT_FOUND');
  if (payment.order.status === 'PAID') {
    return { orderId: payment.orderId, alreadyDone: true };
  }

  if (payment.status !== 'SUCCEEDED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        rawCallback: rawCallback ?? undefined,
      },
    });
  }

  await fulfillPaidOrder(payment.orderId);
  return { orderId: payment.orderId, alreadyDone: false };
}

export async function completePaymentFailed(paymentId: string, rawCallback?: unknown) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === 'SUCCEEDED') return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED', rawCallback: rawCallback ?? undefined },
  });
  await markOrderFailed(payment.orderId);
}

export async function syncTbcPaymentFromBank(bankPaymentId: string) {
  if (isPaymentsTestMode()) return null;

  const payment = await prisma.payment.findFirst({
    where: { bankPaymentId },
  });
  if (!payment) return null;

  const client = new TbcClient();
  const { status, raw } = await client.checkStatus(bankPaymentId);

  if (status === TBC_STATUS_SUCCEEDED) {
    await completePaymentSuccess(payment.id, raw);
    return 'succeeded';
  }
  if (status === TBC_STATUS_FAILED) {
    await completePaymentFailed(payment.id, raw);
    return 'failed';
  }
  return 'pending';
}

export async function completePaymentByBankId(bankPaymentId: string, rawCallback?: unknown) {
  const payment = await prisma.payment.findFirst({
    where: { bankPaymentId },
  });
  if (!payment) return null;

  await completePaymentSuccess(payment.id, rawCallback);
  return payment.orderId;
}
