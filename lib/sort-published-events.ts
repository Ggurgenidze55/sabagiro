export type SortablePublishedEvent = {
  createdAt: Date | string;
  eventDate?: string | null;
  sortOrder?: number;
};

function eventDateMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value.trim());
  return Number.isNaN(ms) ? null : ms;
}

function createdAtMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : Date.parse(String(value));
}

/** Newest events first, then soonest upcoming date. */
export function sortPublishedEvents<T extends SortablePublishedEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const byCreated = createdAtMs(b.createdAt) - createdAtMs(a.createdAt);
    if (byCreated !== 0) return byCreated;

    const dateA = eventDateMs(a.eventDate);
    const dateB = eventDateMs(b.eventDate);
    if (dateA != null && dateB != null && dateA !== dateB) return dateA - dateB;
    if (dateA != null && dateB == null) return -1;
    if (dateA == null && dateB != null) return 1;

    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
