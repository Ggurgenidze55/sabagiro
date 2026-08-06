/** Whole GEL amount for UI — Lari symbol (Flitt / Georgian market). */
export function formatGel(amount: number): string {
  return `${amount.toFixed(0)} ₾`;
}

/** Explicit GEL label where card-scheme / merchant reviews expect the currency code. */
export function formatGelWithCode(amount: number): string {
  return `${amount.toFixed(0)} ₾ (GEL)`;
}
