import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getEventsSeasonLabel, listPublishedEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  noStore();
  const [events, season] = await Promise.all([listPublishedEvents(), getEventsSeasonLabel()]);
  return NextResponse.json({
    season,
    events: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      lineup: e.lineup,
      tag: e.tag,
      dayLabel: e.dayLabel,
      dateLabel: e.dateLabel,
      accent: e.accent,
      isFeatured: e.isFeatured,
      shopUrl: `/shop/${encodeURI(e.slug)}`,
    })),
  });
}
