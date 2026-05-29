const TBILISI = 'Asia/Tbilisi';

/** ISO `YYYY-MM-DD` → display labels used on homepage & shop (e.g. SAT · 31 MAY). */
export function labelsFromEventDate(isoDate: string): { dayLabel: string; dateLabel: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate.trim())) return null;

  const parsed = Date.parse(`${isoDate.trim()}T12:00:00+04:00`);
  if (Number.isNaN(parsed)) return null;

  const date = new Date(parsed);

  const dayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: TBILISI,
  })
    .format(date)
    .replace(/\./g, '')
    .toUpperCase();

  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: TBILISI,
  })
    .format(date)
    .toUpperCase();

  return { dayLabel, dateLabel };
}
