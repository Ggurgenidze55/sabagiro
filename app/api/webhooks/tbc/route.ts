import { NextResponse } from 'next/server';
import {
  completePaymentByBankId,
  completePaymentFailed,
  syncTbcPaymentFromBank,
} from '@/lib/payments/complete-payment';
import { getTbcConfig } from '@/lib/payments/config';
import { verifyTbcWebhook } from '@/lib/payments/tbc/webhook';
import { prisma } from '@/lib/db';
import { TBC_STATUS_FAILED, TBC_STATUS_SUCCEEDED } from '@/lib/payments/tbc/constants';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-tbc-signature') ||
    request.headers.get('callback-signature') ||
    request.headers.get('x-signature') ||
    '';

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';

  const { webhookSecret } = getTbcConfig();
  const verified = verifyTbcWebhook({
    rawBody,
    signature,
    secret: webhookSecret,
    clientIp,
  });

  if (!verified.valid) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const payment = await prisma.payment.findFirst({
    where: { bankPaymentId: verified.paymentId },
  });

  if (!payment) {
    await syncTbcPaymentFromBank(verified.paymentId);
    return NextResponse.json({ ok: true, note: 'synced_or_unknown' });
  }

  const status =
    (verified.payload as Record<string, unknown>).Status ||
    (verified.payload as Record<string, unknown>).status ||
    '';

  if (String(status) === TBC_STATUS_SUCCEEDED) {
    await completePaymentByBankId(verified.paymentId, verified.payload);
  } else if (String(status) === TBC_STATUS_FAILED) {
    await completePaymentFailed(payment.id, verified.payload);
  } else {
    await syncTbcPaymentFromBank(verified.paymentId);
  }

  return NextResponse.json({ ok: true });
}
