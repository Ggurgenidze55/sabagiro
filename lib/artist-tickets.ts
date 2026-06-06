import type { Artist, ClubEvent } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { listPublishedEvents } from '@/lib/events';
import { createTicketForUser, findOrCreateUserForAdmin } from '@/lib/tickets';

const TBILISI_TZ = 'Asia/Tbilisi';

export function tbilisiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TBILISI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Thursday dispatch key — one batch per calendar week in Tbilisi. */
export function artistDispatchWeekKey(date = new Date()): string {
  return tbilisiDateKey(date);
}

function eventEligibleForArtistTickets(event: ClubEvent, todayTbilisi: string) {
  if (!event.eventDate) return true;
  return event.eventDate >= todayTbilisi;
}

export type ArtistDispatchResult = {
  weekKey: string;
  artists: number;
  events: number;
  created: number;
  skipped: number;
  emailsSent: number;
  errors: string[];
};

export async function runWeeklyArtistTicketDispatch(opts?: {
  weekKey?: string;
  createdByUserId?: string;
}): Promise<ArtistDispatchResult> {
  const weekKey = opts?.weekKey ?? artistDispatchWeekKey();
  const todayTbilisi = tbilisiDateKey();

  const [artists, events] = await Promise.all([
    prisma.artist.findMany({
      where: { active: true, weeklyTickets: true },
      orderBy: [{ stageName: 'asc' }, { lastName: 'asc' }],
    }),
    listPublishedEvents(),
  ]);

  const eligibleEvents = events.filter((e) => eventEligibleForArtistTickets(e, todayTbilisi));

  const result: ArtistDispatchResult = {
    weekKey,
    artists: artists.length,
    events: eligibleEvents.length,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  for (const artist of artists) {
    for (const event of eligibleEvents) {
      const existing = await prisma.artistTicketDispatch.findUnique({
        where: {
          artistId_eventSlug_weekKey: {
            artistId: artist.id,
            eventSlug: event.slug,
            weekKey,
          },
        },
      });

      if (existing) {
        result.skipped += 1;
        continue;
      }

      try {
        const ticket = await issueArtistEventTicket({
          artist,
          eventSlug: event.slug,
          weekKey,
          createdByUserId: opts?.createdByUserId,
        });
        result.created += 1;
        if (ticket.emailSent) result.emailsSent += 1;
      } catch (e) {
        const label = artistLabel(artist);
        const message = e instanceof Error ? e.message : 'Failed';
        result.errors.push(`${label} · ${event.title}: ${message}`);
      }
    }
  }

  return result;
}

async function issueArtistEventTicket(opts: {
  artist: Artist;
  eventSlug: string;
  weekKey: string;
  createdByUserId?: string;
}) {
  const user = await ensureArtistUser(opts.artist);

  const { ticket, email } = await createTicketForUser({
    user,
    productSlug: opts.eventSlug,
    source: 'ARTIST',
    createdByUserId: opts.createdByUserId,
    priceGel: 0,
    tierLabel: 'Artist',
    holder: {
      firstName: opts.artist.firstName,
      lastName: opts.artist.lastName,
      personalId: opts.artist.personalId,
      email: opts.artist.email,
      phone: opts.artist.phone,
    },
  });

  await prisma.artistTicketDispatch.create({
    data: {
      artistId: opts.artist.id,
      eventSlug: opts.eventSlug,
      weekKey: opts.weekKey,
      ticketId: ticket.id,
    },
  });

  return { ticket, emailSent: Boolean(email.sent) };
}

async function ensureArtistUser(artist: Artist) {
  if (artist.userId) {
    const linked = await prisma.user.findUnique({ where: { id: artist.userId } });
    if (linked) return linked;
  }

  const user = await findOrCreateUserForAdmin({
    email: artist.email,
    phone: artist.phone,
    firstName: artist.firstName,
    lastName: artist.lastName,
    personalId: artist.personalId,
  });

  if (artist.userId !== user.id) {
    await prisma.artist.update({
      where: { id: artist.id },
      data: { userId: user.id },
    });
  }

  return user;
}

export function artistLabel(artist: Pick<Artist, 'stageName' | 'firstName' | 'lastName'>) {
  if (artist.stageName.trim()) return artist.stageName.trim();
  return `${artist.firstName} ${artist.lastName}`.trim();
}

export function artistDisplayName(artist: Pick<Artist, 'stageName' | 'firstName' | 'lastName'>) {
  const legal = `${artist.firstName} ${artist.lastName}`.trim();
  const stage = artist.stageName.trim();
  if (stage && stage.toLowerCase() !== legal.toLowerCase()) {
    return `${stage} (${legal})`;
  }
  return legal;
}
