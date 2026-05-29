import { prisma } from '@/lib/db';
import { fulfillPaidOrder, markOrderFailed } from '@/lib/payments/fulfill-order';
import { isPaymentsTestMode } from '@/lib/payments/config';
import { FlittClient } from '@/lib/payments/flitt/client';
import { flittStatusToOutcome } from '@/lib/payments/flitt/callback';

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

export async function syncFlittPaymentForOrder(orderId: string) {
  if (isPaymentsTestMode()) return null;

  const payment = await prisma.payment.findFirst({
    where: { orderId, provider: 'FLITT' },
    orderBy: { createdAt: 'desc' },
  });
  if (!payment) return null;

  const client = new FlittClient();
  const { status, raw } = await client.getOrderStatus(orderId);

  if (status === 'succeeded') {
    await completePaymentSuccess(payment.id, raw);
    return 'succeeded';
  }
  if (status === 'failed') {
    await completePaymentFailed(payment.id, raw);
    return 'failed';
  }
  return 'pending';
}

export async function handleFlittCallback(payload: Record<string, unknown>) {
  const orderId = String(payload.order_id || '');
  const paymentId = payload.payment_id != null ? String(payload.payment_id) : null;
  const orderStatus = String(payload.order_status || '');
  const outcome = flittStatusToOutcome(orderStatus);

  let payment = paymentId
    ? await prisma.payment.findFirst({ where: { bankPaymentId: paymentId } })
    : null;

  if (!payment && orderId) {
    payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!payment) return null;

  if (outcome === 'succeeded') {
    await completePaymentSuccess(payment.id, payload);
    return payment.orderId;
  }
  if (outcome === 'failed') {
    await completePaymentFailed(payment.id, payload);
    return payment.orderId;
  }

  return payment.orderId;
}
