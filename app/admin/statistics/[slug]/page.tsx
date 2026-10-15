import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminEventInviteBreakdown } from '@/components/AdminEventInviteBreakdown';
import { AdminEventPromoStatsPanel } from '@/components/AdminEventPromoStatsPanel';
import { AdminTicketStatsPanel } from '@/components/AdminTicketStatsPanel';
import { getSessionUser } from '@/lib/auth';
import { getEventStatisticsDetail } from '@/lib/event-statistics';
import { prisma } from '@/lib/db';
import { canViewEventsAdmin, staffDeniedRedirectPath } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const slug = decodeURIComponent(params.slug).trim();
  const saved = await prisma.eventStatistics.findUnique({
    where: { eventSlug: slug },
    select: { eventTitle: true },
  });
  const event = await prisma.clubEvent.findFirst({ where: { slug }, select: { title: true } });
  const name = saved?.eventTitle ?? event?.title ?? slug;
  return { title: `${name} — Statistics — Admin` };
}

export default async function AdminEventStatisticsDetailPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user || !canViewEventsAdmin(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  const slug = decodeURIComponent(params.slug).trim();
  if (!slug) notFound();

  const { snapshot, finalizedAt, hasLiveTickets } = await getEventStatisticsDetail(slug);
  if (
    snapshot.ticketStats.combined.total === 0 &&
    snapshot.promoBreakdown.length === 0 &&
    !finalizedAt
  ) {
    notFound();
  }

  const eventExists = Boolean(await prisma.clubEvent.findFirst({ where: { slug }, select: { id: true } }));

  return (
    <div className="centered-page">
      <Link href="/admin/statistics" className="back-link">
        ← All statistics
      </Link>
      <header className="centered-page__intro">
        <h1 className="page-title">{snapshot.eventTitle}</h1>
        <p className="page-lead">
          {[snapshot.dayLabel, snapshot.dateLabel].filter(Boolean).join(' · ') ||
            snapshot.eventDate ||
            '—'}
        </p>
        <p className="table-sub">/events/{slug}</p>
        {hasLiveTickets ? (
          <p className="notice-banner notice-banner--inline" style={{ marginTop: '1rem' }}>
            Live data — ticket rows still in DB
            {finalizedAt ? ' · last archived snapshot also on file' : ''}.
          </p>
        ) : finalizedAt ? (
          <p className="notice-banner notice-banner--inline" style={{ marginTop: '1rem' }}>
            Archived snapshot — saved {finalizedAt.toLocaleString('en-GB', { timeZone: 'Asia/Tbilisi' })}{' '}
            (tickets purged).
          </p>
        ) : null}
      </header>
      <div className="centered-page__body">
        <AdminTicketStatsPanel stats={snapshot.ticketStats} title="Tickets" />
        <p className="admin-ticket-stats__lead" style={{ marginTop: '-0.5rem' }}>
          Paid revenue (non-cancelled purchases): <strong>{snapshot.paidRevenueGel} ₾</strong>
          {snapshot.promoTicketsSold > 0 ? (
            <>
              {' '}
              · Promo checkouts: {snapshot.promoOrdersCount} orders, {snapshot.promoTicketsSold}{' '}
              ticket(s), {snapshot.promoDiscountGel} ₾ discount
            </>
          ) : null}
        </p>
        <AdminEventInviteBreakdown
          admin={snapshot.inviteAdmin}
          free={snapshot.inviteFree}
          artist={snapshot.inviteArtist}
        />
        {snapshot.promoBreakdown.length > 0 ? (
          <AdminEventPromoStatsPanel rows={snapshot.promoBreakdown} />
        ) : null}
        <div className="cart-actions" style={{ marginTop: '1.5rem' }}>
          {eventExists ? (
            <Link href={`/admin/events/${encodeURIComponent(slug)}/stats`} className="btn btn--ghost">
              Live event stats
            </Link>
          ) : null}
          <Link href={`/events/${encodeURIComponent(slug)}`} className="btn btn--ghost">
            Public event page
          </Link>
        </div>
      </div>
    </div>
  );
}
