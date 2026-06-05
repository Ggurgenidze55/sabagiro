import type { ClubEvent } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Product } from '@/lib/products';
import { sortPublishedEvents } from '@/lib/sort-published-events';

/** URL-safe slug: lowercase, hyphens, no spaces (fixes /shop/foo bar → 404). */
export function slugifyTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'event';
}

export function normalizeEventSlug(input: string, fallbackTitle?: string) {
  const raw = input.trim() || fallbackTitle?.trim() || '';
  return slugifyTitle(raw);
}

export function eventToProduct(event: ClubEvent): Product {
  const desc = [event.lineup, event.tag].filter(Boolean).join(' — ');
  return {
    slug: event.slug,
    name: event.title,
    description: desc || event.title,
    about: event.about || undefined,
    imagePath: event.imagePath || undefined,
    priceGel: event.isFreeEntry ? 0 : event.priceGel,
    type: 'ticket',
    accent: event.accent,
    tag: `${event.dateLabel} · ${event.dayLabel}`,
    eventDate: event.eventDate ?? undefined,
    isFreeEntry: event.isFreeEntry,
  };
}

export async function listPublishedFreeEntryEvents() {
  if (!hasDatabase()) return [];
  const events = await prisma.clubEvent.findMany({
    where: { published: true, isFreeEntry: true },
  });
  return sortPublishedEvents(events);
}

export async function isPublishedFreeEntryEvent(slug: string) {
  const event = await getPublishedEventBySlug(slug);
  return Boolean(event?.isFreeEntry);
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function listPublishedEvents() {
  if (!hasDatabase()) return [];
  const events = await prisma.clubEvent.findMany({
    where: { published: true },
  });
  return sortPublishedEvents(events);
}

export async function getPublishedEventBySlug(slug: string) {
  if (!hasDatabase()) return null;
  const decoded = decodeURIComponent(slug).trim();
  const normalized = normalizeEventSlug(decoded);

  const direct = await prisma.clubEvent.findFirst({
    where: { published: true, OR: [{ slug: decoded }, { slug: normalized }] },
  });
  if (direct) return direct;

  // Legacy slugs (spaces, manual text) — match by normalized form
  const published = await prisma.clubEvent.findMany({ where: { published: true } });
  return (
    published.find((e) => normalizeEventSlug(e.slug, e.title) === normalized) ?? null
  );
}

/** Fix slugs already stored with spaces or invalid characters. */
export async function normalizeAllEventSlugs() {
  const events = await prisma.clubEvent.findMany();
  const updated: string[] = [];
  for (const ev of events) {
    const next = normalizeEventSlug(ev.slug, ev.title);
    if (next !== ev.slug) {
      await prisma.clubEvent.update({ where: { id: ev.id }, data: { slug: next } });
      updated.push(`${ev.slug} → ${next}`);
    }
  }
  return updated;
}

export async function getEventsSeasonLabel() {
  if (!hasDatabase()) return 'Summer 2025';
  const row = await prisma.siteSetting.findUnique({ where: { key: 'events_season' } });
  return row?.value || 'Summer 2025';
}

export async function setEventsSeasonLabel(value: string) {
  if (!hasDatabase()) return;
  await prisma.siteSetting.upsert({
    where: { key: 'events_season' },
    create: { key: 'events_season', value },
    update: { value },
  });
}
