import type { ClubEvent, User } from '@/generated/prisma/client';
import { INVITATION_TIER_LABEL } from '@/lib/invitation';
import { prisma } from '@/lib/db';
import { createTicketForUser } from '@/lib/tickets';

function verifiedEventDispatchKey(eventSlug: string) {
  return `manual:${eventSlug}`;
}

export type VerifiedInviteDispatchResult = {
  events: number;
  eventTitles: string[];
  verifiedUsers: number;
  created: number;
  skipped: number;
  emailsSent: number;
  errors: string[];
};

export async function runVerifiedInviteDispatch(opts?: {
  eventSlug?: string;
  createdByUserId?: string;
}): Promise<VerifiedInviteDispatchResult> {
  const [events, users] = await Promise.all([
    prisma.clubEvent.findMany({
      where: {
        published: true,
        isFreeEntry: true,
        verifiedInvitesEnabled: true,
        ...(opts?.eventSlug ? { slug: opts.eventSlug } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { dateLabel: 'asc' }],
    }),
    prisma.user.findMany({
      where: {
        role: 'USER',
        verificationStatus: 'VERIFIED',
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const result: VerifiedInviteDispatchResult = {
    events: events.length,
    eventTitles: events.map((e) => e.title),
    verifiedUsers: users.length,
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [],
  };

  for (const event of events) {
    for (const user of users) {
      try {
        const outcome = await issueVerifiedInviteTicket({
          user,
          event,
          createdByUserId: opts?.createdByUserId,
        });
        if (outcome.skipped) {
          result.skipped += 1;
        } else {
          result.created += 1;
          if (outcome.emailSent) result.emailsSent += 1;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed';
        result.errors.push(`${user.email} · ${event.title}: ${message}`);
      }
    }
  }

  return result;
}

async function issueVerifiedInviteTicket(opts: {
  user: User;
  event: ClubEvent;
  createdByUserId?: string;
}) {
  const dispatchKey = verifiedEventDispatchKey(opts.event.slug);

  const existingDispatch = await prisma.verifiedInviteDispatch.findUnique({
    where: {
      userId_eventSlug_dispatchKey: {
        userId: opts.user.id,
        eventSlug: opts.event.slug,
        dispatchKey,
      },
    },
  });
  if (existingDispatch) {
    return { skipped: true, emailSent: false };
  }

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      userId: opts.user.id,
      productSlug: opts.event.slug,
      status: { not: 'CANCELLED' },
    },
    select: { id: true },
  });
  if (existingTicket) {
    return { skipped: true, emailSent: false };
  }

  const holder = {
    firstName: opts.user.firstName,
    lastName: opts.user.lastName,
    personalId: opts.user.personalId,
    email: opts.user.email,
    phone: opts.user.phone,
  };

  const { ticket, email } = await createTicketForUser({
    user: opts.user,
    productSlug: opts.event.slug,
    source: 'FREE',
    createdByUserId: opts.createdByUserId ?? opts.user.id,
    priceGel: 0,
    tierLabel: INVITATION_TIER_LABEL,
    holder,
  });

  await prisma.verifiedInviteDispatch.create({
    data: {
      userId: opts.user.id,
      eventSlug: opts.event.slug,
      dispatchKey,
      ticketId: ticket.id,
    },
  });

  return { skipped: false, emailSent: Boolean(email.sent) };
}
