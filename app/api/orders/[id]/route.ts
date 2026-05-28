import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncTbcPaymentFromBank } from '@/lib/payments/complete-payment';
import { isPaymentsTestMode } from '@/lib/payments/config';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order || order.userId !== session.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (order.status === 'PENDING' && !isPaymentsTestMode()) {
      const bankId = order.payments[0]?.bankPaymentId;
      if (bankId) {
        await syncTbcPaymentFromBank(bankId).catch(() => undefined);
        const refreshed = await prisma.order.findUnique({ where: { id: order.id } });
        if (refreshed) {
          return NextResponse.json({
            id: refreshed.id,
            status: refreshed.status,
            totalGel: refreshed.totalGel,
            paidAt: refreshed.paidAt,
          });
        }
      }
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      totalGel: order.totalGel,
      paidAt: order.paidAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
