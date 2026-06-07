import type { Ticket, TicketSource, User } from '@/generated/prisma/client';

type UserLabel = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;

export function formatUserLabel(user: UserLabel) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function describeTicketIssuance(
  ticket: Pick<Ticket, 'source' | 'priceGel'>,
  owner: UserLabel,
  createdBy: UserLabel | null,
) {
  const ownerLabel = formatUserLabel(owner);
  const actor = createdBy ?? owner;
  const actorLabel = formatUserLabel(actor);

  if (ticket.source === 'PURCHASE') {
    return {
      holderNote: 'Ticket Holder (Entry)',
      actorNote: 'Purchased by',
      actorLabel,
      ownerLabel,
      detail: actor.id === owner.id ? `${actorLabel} · ${owner.email}` : `${actorLabel} → account: ${ownerLabel}`,
    };
  }

  if (ticket.source === 'FREE') {
    return {
      holderNote: 'Ticket Holder (Entry)',
      actorNote: 'Free ticket issued by',
      actorLabel,
      ownerLabel,
      detail: `${actorLabel} (free ticket · account ${ownerLabel})`,
    };
  }

  if (ticket.source === 'ARTIST') {
    return {
      holderNote: 'Ticket Holder (Entry)',
      actorNote: 'Artist list · issued by',
      actorLabel,
      ownerLabel,
      detail: `${actorLabel} · artist list ticket · ${ownerLabel}`,
    };
  }

  return {
    holderNote: 'Ticket Holder (Entry)',
    actorNote: 'Admin issued by',
    actorLabel,
    ownerLabel,
    detail: `${actorLabel} · account: ${ownerLabel}`,
  };
}

export function sourceLabel(source: TicketSource) {
  switch (source) {
    case 'PURCHASE':
      return 'Purchase';
    case 'FREE':
      return 'Free';
    case 'ADMIN':
      return 'Admin';
    case 'ARTIST':
      return 'Artist';
    default:
      return source;
  }
}
