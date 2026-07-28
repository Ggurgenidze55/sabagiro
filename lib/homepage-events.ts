import { getEventsSeasonLabel, listPublishedEvents } from '@/lib/events';

export type HomepageEventItem = {
  slug: string;
  title: string;
  lineup: string;
  tag: string;
  dayLabel: string;
  dateLabel: string;
  doorsOpen?: string;
  accent: string;
  isFeatured: boolean;
  isFreeEntry: boolean;
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
      doorsOpen: e.doorsOpen?.trim() || undefined,
      accent: e.accent,
      isFeatured: e.isFeatured,
      isFreeEntry: e.isFreeEntry,
      shopUrl: `/events/${encodeURI(e.slug)}`,
    })),
  };
}
