import type { PromoCode } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

export function normalizePromoCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export { discountedUnitPriceGel } from '@/lib/promo-price';

export type ResolvedPromoCode = {
  row: PromoCode;
  percentOff: number;
  eventSlug: string;
};

export async function resolvePromoCodeForEvent(
  rawCode: string,
  eventSlug: string,
): Promise<ResolvedPromoCode | null> {
  const code = normalizePromoCodeInput(rawCode);
  if (!code) return null;

  const row = await prisma.promoCode.findUnique({ where: { code } });
  if (!row || !row.active) return null;
  if (row.eventSlug !== eventSlug) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  if (row.maxUses != null && row.usedCount >= row.maxUses) return null;

  return { row, percentOff: row.percentOff, eventSlug: row.eventSlug };
}

export async function assertPromoCodeForCheckout(rawCode: string, eventSlug: string): Promise<ResolvedPromoCode> {
  const resolved = await resolvePromoCodeForEvent(rawCode, eventSlug);
  if (!resolved) throw new Error('INVALID_PROMO');
  return resolved;
}

/** Consume one use when payment succeeds (re-check limits in transaction). */
export async function consumePromoCodeUse(promoCodeId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
    if (!row?.active) return false;
    if (row.expiresAt && row.expiresAt < new Date()) return false;
    if (row.maxUses != null && row.usedCount >= row.maxUses) return false;
    await tx.promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
    return true;
  });
}
