import { AdminUsersPanel } from '@/components/AdminUsersPanel';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Users — Admin' };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">USERS</h1>
        <p className="page-lead">
          Review Facebook &amp; Instagram links, then verify users so they can buy tickets.
        </p>
      </header>
      <div className="centered-page__body admin-users-panel">
        <AdminUsersPanel
          users={users.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          personalId: u.personalId,
          facebookUrl: u.facebookUrl,
          instagramUrl: u.instagramUrl,
          verificationStatus: u.verificationStatus,
          role: u.role,
          ticketCount: u._count.tickets,
          ticketLimitPerEvent: u.ticketLimitPerEvent,
          freeTicketsEnabled: u.freeTicketsEnabled,
          freeTicketsQuota: u.freeTicketsQuota,
          freeTicketsUsed: u.freeTicketsUsed,
        }))}
        />
      </div>
    </div>
  );
}
