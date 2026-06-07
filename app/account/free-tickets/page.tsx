import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { FreeTicketGenerator } from '@/components/FreeTicketGenerator';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { showFreeTicketsInNav } from '@/lib/ticket-access';
import { isProfileCompleteForTicket } from '@/lib/user-ticket-holder';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Free tickets — Sabagiro' };

export default async function FreeTicketsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/free-tickets');
  if (!showFreeTicketsInNav(user)) redirect('/account');

  const freeUsedRows = await prisma.ticket.groupBy({
    by: ['productSlug'],
    where: {
      userId: user.id,
      source: 'FREE',
      status: { not: 'CANCELLED' },
    },
    _count: { _all: true },
  });

  const freeUsedByEvent = Object.fromEntries(
    freeUsedRows.map((row) => [row.productSlug, row._count._all]),
  ) as Record<string, number>;

  return (
    <SiteChrome current="account">
      <div className="dash-head">
        <div>
          <h1 className="page-title">FREE TICKETS</h1>
          <p className="page-lead">
            All events · {user.freeTicketsQuota} free ticket(s) per event
          </p>
        </div>
        <div className="dash-head__actions">
          <Link href="/account" className="btn btn--ghost">
            My tickets
          </Link>
        </div>
      </div>

      <SectionDivider />
      <FreeTicketGenerator
        quota={user.freeTicketsQuota}
        usedByEvent={freeUsedByEvent}
        profileComplete={isProfileCompleteForTicket(user)}
      />
    </SiteChrome>
  );
}
