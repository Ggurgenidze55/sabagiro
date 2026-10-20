import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncFlittPaymentForOrder } from '@/lib/payments/complete-payment';
import { isPaymentsTestMode } from '@/lib/payments/config';
import { isFlittTestApproval } from '@/lib/payments/flitt/callback';

/**
 * Public order payment status for the Flitt return page.
 * Order ids are cuid — not secret, but hard to guess; only status fields are returned.
 */
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId')?.trim() ?? '';
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (order.status === 'PENDING' && !isPaymentsTestMode()) {
    await syncFlittPaymentForOrder(order.id).catch(() => undefined);
  }

  const refreshed = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!refreshed) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payment = refreshed.payments[0];
  let failReason: 'flitt_test' | 'declined' | null = null;
  if (refreshed.status === 'FAILED' || refreshed.status === 'CANCELLED' || refreshed.status === 'EXPIRED') {
    const raw = payment?.rawCallback;
    if (raw && typeof raw === 'object' && isFlittTestApproval(raw as Record<string, unknown>)) {
      failReason = 'flitt_test';
    } else {
      failReason = 'declined';
    }
  }

  return NextResponse.json({
    id: refreshed.id,
    status: refreshed.status,
    totalGel: refreshed.totalGel,
    paidAt: refreshed.paidAt,
    failReason,
  });
}
