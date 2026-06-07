import type { Artist, ClubEvent } from '@/generated/prisma/client';
import { artistDisplayName, artistLabel } from '@/lib/artist-display';
import { prisma } from '@/lib/db';
import { createTicketForUser, findOrCreateUserForAdmin } from '@/lib/tickets';

export { artistDisplayName, artistLabel } from '@/lib/artist-display';

const TBILISI_TZ = 'Asia/Tbilisi';

export function tbilisiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TBILISI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addTbilisiDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Event date (YYYY-MM-DD) that artist tickets should be sent for when cron runs on referenceDate. */
export function artistTicketTargetEventDate(referenceDate = new Date()): string {
  return addTbilisiDays(tbilisiDateKey(referenceDate), 1);
}

/** @deprecated Use artistTicketTargetEventDate — kept for admin API compatibility. */
export function artistDispatchWeekKey(date = new Date()): string {
  return artistTicketTargetEventDate(date);
}

function artistEventDispatchKey(eventSlug: string) {
  return `pre-event:${eventSlug}`;
}

export type ArtistDispatchResult = {
  /** Event date tickets were issued for (tomorrow from cron run day). */
  targetEventDate: string;
  /** Legacy alias for cron responses. */
  weekKey: string;
  artists: number;
  events: number;
  created: number;
  skipped: number;
  emailsSent: number;
  errors: string[];
};

export async function runArtistPreEventTicketDispatch(opts?: {
  referenceDate?: Date;
  createdByUserId?: string;
}): Promise<ArtistDispatchResult> {
  const referenceDate = opts?.referenceDate ?? new Date();
  const targetEventDate = artistTicketTargetEventDate(referenceDate);

  const [artists, events] = await Promise.all([
    prisma.artist.findMany({
      where: { active: true, weeklyTickets: true },
      orderBy: [{ stageName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.clubEvent.findMany({
      where: {
        published: true,
        artistTicketsEnabled: true,
        eventDate: targetEventDate,
      },
      orderBy: [{ sortOrder: 'asc' }, { dateLabel: 'asc' }],
    }),
  ]);

  const result: ArtistDispatchResult = {
    targetEventDate,
    weekKey: targetEventDate,
    artists: artists.length,
    events: events.length,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  for (const artist of artists) {
    for (const event of events) {
      const dispatchKey = artistEventDispatchKey(event.slug);
      const existing = await prisma.artistTicketDispatch.findUnique({
        where: {
          artistId_eventSlug_weekKey: {
            artistId: artist.id,
            eventSlug: event.slug,
            weekKey: dispatchKey,
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
          event,
          dispatchKey,
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

/** @deprecated Alias — runs day-before dispatch for events happening tomorrow. */
export async function runWeeklyArtistTicketDispatch(opts?: {
  weekKey?: string;
  createdByUserId?: string;
}): Promise<ArtistDispatchResult> {
  void opts?.weekKey;
  return runArtistPreEventTicketDispatch({ createdByUserId: opts?.createdByUserId });
}

async function issueArtistEventTicket(opts: {
  artist: Artist;
  event: ClubEvent;
  dispatchKey: string;
  createdByUserId?: string;
}) {
  const user = await ensureArtistUser(opts.artist);

  const { ticket, email } = await createTicketForUser({
    user,
    productSlug: opts.event.slug,
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
      eventSlug: opts.event.slug,
      weekKey: opts.dispatchKey,
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

const artistAccountSelect = {
  stageName: true,
  firstName: true,
  lastName: true,
  weeklyTickets: true,
  active: true,
} as const;

/** Artist roster row linked to this account (by userId or email). */
export async function getArtistForAccountUser(user: { id: string; email: string }) {
  const byUser = await prisma.artist.findUnique({
    where: { userId: user.id },
    select: artistAccountSelect,
  });
  if (byUser) return byUser;

  const byEmail = await prisma.artist.findFirst({
    where: { email: user.email },
    select: { ...artistAccountSelect, id: true, userId: true },
  });
  if (!byEmail) return null;

  if (byEmail.userId !== user.id) {
    await prisma.artist.update({
      where: { id: byEmail.id },
      data: { userId: user.id },
    });
  }

  return {
    stageName: byEmail.stageName,
    firstName: byEmail.firstName,
    lastName: byEmail.lastName,
    weeklyTickets: byEmail.weeklyTickets,
    active: byEmail.active,
  };
}
