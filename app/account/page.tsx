import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteChrome } from '@/components/SiteChrome';
import { LogoutButton } from '@/components/LogoutButton';
import { TicketQrCard } from '@/components/TicketQrCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'My account — Sabagiro' };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <SiteChrome>
      <div className="dash-head">
        <div>
          <h1 className="page-title">MY ACCOUNT</h1>
          <p className="page-lead">
            {user.firstName} {user.lastName} · {user.email} · {user.phone}
          </p>
        </div>
        <div className="dash-head__actions">
          <Link href="/account/settings" className="btn btn--ghost">
            Settings
          </Link>
          {user.role === 'ADMIN' ? (
            <Link href="/admin" className="btn">
              Admin
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </div>

      <h2 className="section-title">My tickets</h2>
      {tickets.length === 0 ? (
        <p className="cart-empty">
          No tickets yet. <Link href="/shop">Buy tickets</Link>
        </p>
      ) : (
        <div className="ticket-grid">
          {tickets.map((t) => (
            <TicketQrCard
              key={t.id}
              ticketId={t.id}
              productName={t.productName}
              status={t.status}
              holderName={`${t.holderFirstName} ${t.holderLastName}`}
              personalId={t.holderPersonalId}
            />
          ))}
        </div>
      )}
    </SiteChrome>
  );
}
