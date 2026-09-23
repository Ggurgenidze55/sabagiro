import type { ClubEvent } from '@/generated/prisma/client';
import { clubEventPublicArchiveWhere } from '@/lib/event-archive';
import { isPastEventDate } from '@/lib/event-past';
import { prisma } from '@/lib/db';
import type { Product } from '@/lib/products';
import { sortEventsArchive, sortPublishedEvents } from '@/lib/sort-published-events';

export const EVENTS_LIST_PAGE_SIZE = 10;

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
    lineup: event.lineup || undefined,
    venueTag: event.tag || undefined,
    tag: `${event.dateLabel} · ${event.dayLabel}`,
    eventDate: event.eventDate ?? undefined,
    doorsOpen: event.doorsOpen?.trim() || undefined,
    isFreeEntry: event.isFreeEntry,
    freeEntryAccess: (event as ClubEvent & { freeEntryAccess?: 'ALL_VERIFIED' | 'INVITED_ONLY' })
      .freeEntryAccess ?? 'INVITED_ONLY',
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

export async function listPublishedEventsPaginated(page: number, pageSize = EVENTS_LIST_PAGE_SIZE) {
  return listPublicArchiveEventsPaginated(page, pageSize);
}

/** /events list — published + hidden past nights (archive). */
export async function listPublicArchiveEventsPaginated(page: number, pageSize = EVENTS_LIST_PAGE_SIZE) {
  if (!hasDatabase()) {
    return { events: [], total: 0, totalPages: 1, page: 1, pageSize };
  }

  const events = await prisma.clubEvent.findMany({
    where: clubEventPublicArchiveWhere(),
  });
  const sorted = sortEventsArchive(events);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    events: sorted.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    pageSize,
  };
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

/** Event page from /events archive — includes hidden past nights. */
export async function getPublicArchiveEventBySlug(slug: string) {
  const live = await getPublishedEventBySlug(slug);
  if (live) return live;
  if (!hasDatabase()) return null;

  const decoded = decodeURIComponent(slug).trim();
  const normalized = normalizeEventSlug(decoded);

  const direct = await prisma.clubEvent.findFirst({
    where: { OR: [{ slug: decoded }, { slug: normalized }] },
  });
  if (direct && !direct.published && isPastEventDate(direct.eventDate)) return direct;

  const archived = await prisma.clubEvent.findMany({
    where: clubEventPublicArchiveWhere(),
  });
  return (
    archived.find((e) => normalizeEventSlug(e.slug, e.title) === normalized) ?? null
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
