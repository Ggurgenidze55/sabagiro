/** National ID / passport / identification number — any country. */

export const PERSONAL_ID_MIN = 4;
export const PERSONAL_ID_MAX = 32;

/** Letters, digits, hyphen, slash — common passport and national ID formats. */
const PERSONAL_ID_RE = /^[A-Za-z0-9\-/]+$/;

export const PERSONAL_ID_LABEL = 'ID or passport number';

export const PERSONAL_ID_INVALID_MESSAGE = `Enter a valid ${PERSONAL_ID_LABEL.toLowerCase()} (${PERSONAL_ID_MIN}–${PERSONAL_ID_MAX} letters or digits).`;

/** HTML5 pattern for client-side hint (server validates in personalIdSchema). */
export const PERSONAL_ID_HTML_PATTERN = `[A-Za-z0-9\\-/]{${PERSONAL_ID_MIN},${PERSONAL_ID_MAX}}`;

export function normalizePersonalId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidPersonalId(value: string): boolean {
  const id = normalizePersonalId(value);
  return id.length >= PERSONAL_ID_MIN && id.length <= PERSONAL_ID_MAX && PERSONAL_ID_RE.test(id);
}
