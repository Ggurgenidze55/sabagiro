import 'server-only';

import { prisma } from '@/lib/db';
import { isAppleWalletConfigured } from '@/lib/wallet/apple-config';
import { sendWalletPassPush, isWalletPushConfigured } from '@/lib/wallet/apple-push';
import { touchWalletPassUpdated } from '@/lib/wallet/pass-auth';

/** Notify devices that a ticket pass changed (USED, CANCELLED, etc.). */
export async function notifyWalletPassUpdate(ticketId: string) {
  if (!isAppleWalletConfigured()) return;

  await touchWalletPassUpdated(ticketId);

  if (!isWalletPushConfigured()) return;

  const registrations = await prisma.walletPassRegistration.findMany({
    where: { ticketId },
    select: { pushToken: true },
  });

  await Promise.all(registrations.map((r) => sendWalletPassPush(r.pushToken)));
}
