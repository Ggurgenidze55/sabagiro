/**
 * Ticket-holder age rules for checkout.
 *
 * Georgian პირადი ნომერი is an 11-digit registry id (admin unit + check +
 * office + serial). It does **not** encode date of birth — do not infer age
 * from it. Age is declared by the buyer and confirmed with the 18+ checkbox;
 * door staff check the physical ID.
 */

/** Declared age must be 18+; checkbox required. Personal ID is not used for age. */
export function validateAdultHolder(
  _personalId: string,
  confirmAdult18: boolean,
  _eventDateIso?: string | null,
): void {
  if (!confirmAdult18) throw new Error('ADULT_CONFIRM_REQUIRED');
}

/** Declared age + 18+ confirmation — blocks checkout under 18. */
export function validateAdultHolderWithDeclaredAge(
  _personalId: string,
  declaredAge: number,
  confirmAdult18: boolean,
  _eventDateIso?: string | null,
): void {
  if (!Number.isFinite(declaredAge) || declaredAge < 18) {
    throw new Error('UNDERAGE');
  }
  if (!confirmAdult18) throw new Error('ADULT_CONFIRM_REQUIRED');
}
