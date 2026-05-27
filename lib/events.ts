import type { ClubEvent } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Product } from '@/lib/products';

export function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function eventToProduct(event: ClubEvent): Product {
  const desc = [event.lineup, event.tag].filter(Boolean).join(' — ');
  return {
    slug: event.slug,
    name: event.title,
    description: desc || event.title,
    priceGel: event.priceGel,
    type: 'ticket',
    accent: event.accent,
    tag: `${event.dateLabel} · ${event.dayLabel}`,
    eventDate: event.eventDate ?? undefined,
  };
}

export async function listPublishedEvents() {
  return prisma.clubEvent.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getPublishedEventBySlug(slug: string) {
  return prisma.clubEvent.findFirst({
    where: { slug, published: true },
  });
}

export async function getEventsSeasonLabel() {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'events_season' } });
  return row?.value || 'Summer 2025';
}

export async function setEventsSeasonLabel(value: string) {
  await prisma.siteSetting.upsert({
    where: { key: 'events_season' },
    create: { key: 'events_season', value },
    update: { value },
  });
}
