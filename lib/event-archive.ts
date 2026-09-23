import type { Prisma } from '@/generated/prisma/client';

/** Calendar date in Tbilisi (YYYY-MM-DD). */
export function tbilisiTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Public /events archive: live published nights + past nights that were hidden after the date.
 * Unpublished future drafts stay admin-only.
 */
export function clubEventPublicArchiveWhere(todayIso = tbilisiTodayIso()): Prisma.ClubEventWhereInput {
  return {
    OR: [
      { published: true },
      {
        published: false,
        eventDate: { not: null, lt: todayIso },
      },
    ],
  };
}
