import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AdminTicketStatsPanel } from '@/components/AdminTicketStatsPanel';
import { getSessionUser } from '@/lib/auth';
import { getAdminTicketStatsForEvent } from '@/lib/admin-ticket-stats';
import { prisma } from '@/lib/db';
import { canViewEventsAdmin, staffDeniedRedirectPath } from '@/lib/staff-roles';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps) {
  const event = await prisma.clubEvent.findFirst({
    where: { slug: params.slug },
    select: { title: true },
  });
  const name = event?.title ?? params.slug;
  return { title: `${name} — Stats — Admin` };
}

export default async function AdminEventStatsPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user || !canViewEventsAdmin(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  const slug = decodeURIComponent(params.slug).trim();
  if (!slug) notFound();

  const [event, stats] = await Promise.all([
    prisma.clubEvent.findFirst({
      where: { slug },
      select: {
        title: true,
        dayLabel: true,
        dateLabel: true,
        eventDate: true,
        published: true,
      },
    }),
    getAdminTicketStatsForEvent(slug),
  ]);

  const dateLine = [event?.dayLabel, event?.dateLabel].filter(Boolean).join(' ');
  const hasTickets = stats.combined.total > 0;

  return (
    <div className="centered-page">
      <Link href="/admin/events" className="back-link">
        ← Events
      </Link>
      <header className="centered-page__intro">
        <h1 className="page-title">EVENT STATS</h1>
        <p className="page-lead">
          {event?.title ?? slug}
          {dateLine ? ` · ${dateLine}` : ''}
          {event && !event.published ? ' · Hidden' : ''}
        </p>
        <p className="table-sub">/events/{slug}</p>
      </header>
      <div className="centered-page__body">
        {!hasTickets ? (
          <p className="cart-empty">No tickets issued for this event yet.</p>
        ) : (
          <AdminTicketStatsPanel stats={stats} title="This event only" />
        )}
        <div className="cart-actions" style={{ marginTop: '1.5rem' }}>
          <Link href={`/events/${encodeURIComponent(slug)}`} className="btn btn--ghost">
            Public event page
          </Link>
        </div>
      </div>
    </div>
  );
}
