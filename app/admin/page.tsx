import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFullAdminTools, staffAdminLandingPath } from '@/lib/staff-roles';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin — Sabagiro' };

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (!canUseFullAdminTools(user.role)) {
    redirect(staffAdminLandingPath(user.role));
  }

  const [users, tickets, sold] = await Promise.all([
    prisma.user.count(),
    prisma.ticket.count(),
    prisma.ticket.aggregate({ _sum: { priceGel: true } }),
  ]);

  return (
    <>
      <h1 className="page-title">ADMIN</h1>
      <p className="page-lead">Door control · users · tickets</p>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Users</span>
          <span className="stat-card__value">{users}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Tickets sold</span>
          <span className="stat-card__value">{tickets}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Revenue (GEL)</span>
          <span className="stat-card__value">{sold._sum.priceGel ?? 0}</span>
        </div>
      </div>
      <div className="cart-actions" style={{ marginTop: '2rem' }}>
        <Link href="/admin/events" className="btn">
          MANAGE EVENTS
        </Link>
        <Link href="/admin/artists" className="btn btn--ghost">
          DJ LIST
        </Link>
        <Link href="/admin/generate" className="btn btn--ghost">
          GENERATE TICKET
        </Link>
        <Link href="/admin/tickets" className="btn btn--ghost">
          All tickets
        </Link>
      </div>
    </>
  );
}
