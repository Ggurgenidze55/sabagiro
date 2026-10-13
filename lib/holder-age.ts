import { normalizePersonalId } from '@/lib/personal-id';

/** Georgian 11-digit personal ID → birth date (UTC midnight), or null. */
export function birthDateFromGeorgianPersonalId(personalId: string): Date | null {
  const id = normalizePersonalId(personalId);
  if (!/^\d{11}$/.test(id)) return null;

  const centuryDigit = parseInt(id[0]!, 10);
  let year = parseInt(id.slice(1, 3), 10);
  const month = parseInt(id.slice(3, 5), 10);
  const day = parseInt(id.slice(5, 7), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  if (centuryDigit === 0 || centuryDigit === 1) year += 2000;
  else if (centuryDigit === 2 || centuryDigit === 3) year += 1900;
  else if (centuryDigit === 4 || centuryDigit === 5) year += 1800;
  else return null;

  const birth = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(birth.getTime())) return null;
  return birth;
}

function referenceMs(eventDateIso?: string | null): number {
  if (eventDateIso?.trim()) {
    const parsed = Date.parse(`${eventDateIso.trim()}T12:00:00+04:00`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function isAtLeast18FromGeorgianId(personalId: string, eventDateIso?: string | null): boolean | null {
  const birth = birthDateFromGeorgianPersonalId(personalId);
  if (!birth) return null;
  const ref = referenceMs(eventDateIso);
  const ageYears = (ref - birth.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
  return ageYears >= 18;
}

/** Georgian ID must parse as 18+; other IDs require explicit checkbox. */
export function validateAdultHolder(
  personalId: string,
  confirmAdult18: boolean,
  eventDateIso?: string | null,
): void {
  const fromId = isAtLeast18FromGeorgianId(personalId, eventDateIso);
  if (fromId === true) return;
  if (fromId === false) throw new Error('UNDERAGE');
  if (!confirmAdult18) throw new Error('ADULT_CONFIRM_REQUIRED');
}
