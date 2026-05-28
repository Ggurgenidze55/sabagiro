import type { Ticket, TicketSource, User } from '@prisma/client';

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
      holderNote: 'საკარის ბილეთის მფლობელი (შესვლა)',
      actorNote: 'ყიდვა',
      actorLabel,
      ownerLabel,
      detail: actor.id === owner.id ? `${actorLabel} · ${owner.email}` : `${actorLabel} → ანგარიში: ${ownerLabel}`,
    };
  }

  if (ticket.source === 'FREE') {
    return {
      holderNote: 'საკარის ბილეთის მფლობელი (შესვლა)',
      actorNote: 'უფასო გენერაცია',
      actorLabel,
      ownerLabel,
      detail: `${actorLabel} (უფასო ბილეთი · ანგარიში ${ownerLabel})`,
    };
  }

  return {
    holderNote: 'საკარის ბილეთის მფლობელი (შესვლა)',
    actorNote: 'ადმინის გენერაცია',
    actorLabel,
    ownerLabel,
    detail: `${actorLabel} · ანგარიში: ${ownerLabel}`,
  };
}

export function sourceLabel(source: TicketSource) {
  switch (source) {
    case 'PURCHASE':
      return 'ყიდვა';
    case 'FREE':
      return 'უფასო';
    case 'ADMIN':
      return 'ადმინი';
    default:
      return source;
  }
}
