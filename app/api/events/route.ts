import { NextResponse } from 'next/server';
import { getEventsSeasonLabel, listPublishedEvents } from '@/lib/events';

export async function GET() {
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
      shopUrl: `/shop/${e.slug}`,
    })),
  });
}
