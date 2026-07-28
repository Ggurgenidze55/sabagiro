import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site-url';

export function walletPassWebServiceUrl(): string {
  return siteUrl('/api/wallet/passkit');
}

export async function getOrCreateWalletPassAuth(ticketId: string) {
  const existing = await prisma.walletPassAuth.findUnique({ where: { ticketId } });
  if (existing) return existing;

  return prisma.walletPassAuth.create({
    data: {
      ticketId,
      authenticationToken: randomBytes(24).toString('hex'),
    },
  });
}

export async function verifyWalletPassAuth(serialNumber: string, token: string | null) {
  if (!token) return false;
  const auth = await prisma.walletPassAuth.findUnique({ where: { ticketId: serialNumber } });
  return Boolean(auth && auth.authenticationToken === token);
}

export async function touchWalletPassUpdated(ticketId: string) {
  await prisma.walletPassAuth.upsert({
    where: { ticketId },
    create: {
      ticketId,
      authenticationToken: randomBytes(24).toString('hex'),
    },
    update: {},
  });
}

export function walletPassUpdatedTag(updatedAt: Date): string {
  return updatedAt.toISOString();
}
