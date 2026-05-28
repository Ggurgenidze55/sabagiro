import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  completePaymentFailed,
  completePaymentSuccess,
} from '@/lib/payments/complete-payment';
import { isPaymentsTestMode } from '@/lib/payments/config';

const bodySchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(['approve', 'decline']),
});

export async function POST(request: Request) {
  if (!isPaymentsTestMode()) {
    return NextResponse.json({ error: 'Test payments disabled' }, { status: 403 });
  }

  try {
    const session = await requireUser();
    const { orderId, action } = bodySchema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!order || order.userId !== session.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const payment = order.payments[0];
    if (!payment || payment.provider !== 'TEST') {
      return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    }

    if (action === 'approve') {
      await completePaymentSuccess(payment.id, { test: true });
      return NextResponse.json({ ok: true, status: 'PAID' });
    }

    await completePaymentFailed(payment.id, { test: true, declined: true });
    return NextResponse.json({ ok: true, status: 'FAILED' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
