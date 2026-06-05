/** How many manual holder forms / stored holders are required for a checkout line. */
export function extraHolderCount(cartQty: number, existingPurchasedCount: number): number {
  if (cartQty <= 0) return 0;
  const buyerAutoFillSlots = existingPurchasedCount === 0 ? 1 : 0;
  return Math.max(0, cartQty - buyerAutoFillSlots);
}

/** 1-based ticket number shown on holder forms. */
export function holderFormTicketNumber(slot: number, existingPurchasedCount: number): number {
  return existingPurchasedCount + slot + (existingPurchasedCount === 0 ? 2 : 1);
}
