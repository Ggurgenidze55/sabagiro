import { SoldTicketsTable } from '@/components/SoldTicketsTable';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFullAdminTools, staffDeniedRedirectPath } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Tickets — Admin' };

/** Max rows loaded on All tickets (search runs client-side on this set). */
const ADMIN_TICKETS_LIST_LIMIT = 10_000;

export default async function AdminTicketsPage() {
  const user = await getSessionUser();
  if (!user || !canUseFullAdminTools(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  const [totalCount, tickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
      take: ADMIN_TICKETS_LIST_LIMIT,
    }),
  ]);

  return (
    <>
      <h1 className="page-title">SOLD TICKETS</h1>
      <p className="page-lead">
        {totalCount} in database
        {totalCount > tickets.length
          ? ` · showing newest ${tickets.length} (contact dev to raise limit)`
          : ''}
        . Tickets 4+ days after event are auto-deleted.
      </p>
      <SoldTicketsTable
        totalCount={totalCount}
        tickets={tickets.map((t) => ({
          id: t.id,
          productName: t.productName,
          holderFirstName: t.holderFirstName,
          holderLastName: t.holderLastName,
          holderPersonalId: t.holderPersonalId,
          holderEmail: t.holderEmail,
          holderPhone: t.holderPhone,
          accountEmail: t.user?.email ?? null,
          priceGel: t.priceGel,
          status: t.status,
          qrToken: t.qrToken,
        }))}
      />
    </>
  );
}
