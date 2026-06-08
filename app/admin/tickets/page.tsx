import { SoldTicketsTable } from '@/components/SoldTicketsTable';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUseFullAdminTools } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Tickets — Admin' };

export default async function AdminTicketsPage() {
  const user = await getSessionUser();
  if (!user || !canUseFullAdminTools(user.role)) redirect('/account');

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
    take: 200,
  });

  return (
    <>
      <h1 className="page-title">SOLD TICKETS</h1>
      <SoldTicketsTable
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
