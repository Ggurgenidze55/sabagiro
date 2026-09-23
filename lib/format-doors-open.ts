/** Format stored HH:MM (24h) for public display. */
export function formatDoorsOpenLabel(time: string | null | undefined): string | null {
  const trimmed = time?.trim();
  if (!trimmed) return null;
  return `Doors open ${trimmed}`;
}
