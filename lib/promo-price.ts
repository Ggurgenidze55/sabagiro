/** Client-safe promo price math (no DB). */
export function discountedUnitPriceGel(priceGel: number, percentOff: number): number {
  const pct = Math.min(100, Math.max(0, percentOff));
  const next = Math.round((priceGel * (100 - pct)) / 100);
  return Math.max(0, next);
}
