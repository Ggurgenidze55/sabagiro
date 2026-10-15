import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminStatisticsList } from '@/components/AdminStatisticsList';
import { getSessionUser } from '@/lib/auth';
import { listEventStatisticsForAdmin } from '@/lib/event-statistics';
import { canViewEventsAdmin, staffDeniedRedirectPath } from '@/lib/staff-roles';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Statistics — Admin' };

export default async function AdminStatisticsPage() {
  const user = await getSessionUser();
  if (!user || !canViewEventsAdmin(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  const rows = await listEventStatisticsForAdmin();

  return (
    <div className="centered-page">
      <Link href="/admin/events" className="back-link">
        ← Events
      </Link>
      <header className="centered-page__intro">
        <h1 className="page-title">STATISTICS</h1>
        <p className="page-lead">
          Per-event ticket and promo numbers — kept after tickets are removed from the database (~4
          days after the night).
        </p>
      </header>
      <div className="centered-page__body">
        <AdminStatisticsList rows={rows} />
      </div>
    </div>
  );
}
