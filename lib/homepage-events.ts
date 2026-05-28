import { getEventsSeasonLabel, listPublishedEvents } from '@/lib/events';

export type HomepageEventItem = {
  slug: string;
  title: string;
  lineup: string;
  tag: string;
  dayLabel: string;
  dateLabel: string;
  accent: string;
  isFeatured: boolean;
  shopUrl: string;
};

export type HomepageEventsPayload = {
  season: string;
  events: HomepageEventItem[];
};

export async function getHomepageEventsPayload(): Promise<HomepageEventsPayload> {
  const [events, season] = await Promise.all([listPublishedEvents(), getEventsSeasonLabel()]);
  return {
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
  };
}
