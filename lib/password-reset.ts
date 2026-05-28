import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site-url';

export const PASSWORD_RESET_TTL_MINUTES = 60;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createPasswordResetLink(userId: string): Promise<string | null> {
  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return siteUrl(`/reset-password?token=${encodeURIComponent(raw)}`);
}

export async function consumePasswordResetToken(
  rawToken: string,
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken.trim());
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return { userId: row.userId };
}
