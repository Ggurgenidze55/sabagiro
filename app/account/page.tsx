import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteChrome } from '@/components/SiteChrome';
import { FreeTicketGenerator } from '@/components/FreeTicketGenerator';
import { LogoutButton } from '@/components/LogoutButton';
import { TicketQrCard } from '@/components/TicketQrCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { describeTicketIssuance } from '@/lib/ticket-issuance';
import { getTicketLimitPerEvent } from '@/lib/ticket-purchase-limit';
import { verificationLabel } from '@/lib/verification';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'My account — Sabagiro' };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  });

  const purchaseLimit = getTicketLimitPerEvent(user);

  return (
    <SiteChrome current="account">
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

      {user.role !== 'ADMIN' ? (
        <div
          className={`verify-banner verify-banner--${user.verificationStatus.toLowerCase()}`}
          style={{ marginBottom: '1.5rem' }}
        >
          <p className="verify-banner__title">{verificationLabel(user.verificationStatus)}</p>
          {user.verificationStatus === 'PENDING' ? (
            <p className="page-lead">
              We are reviewing your Facebook &amp; Instagram links. Ticket purchase unlocks after
              approval.
            </p>
          ) : null}
          {user.verificationStatus === 'REJECTED' ? (
            <p className="page-lead">
              Your account was not verified. Check your social links in settings or contact the
              club.
            </p>
          ) : null}
          {user.verificationStatus === 'VERIFIED' ? (
            <p className="page-lead">
              {user.freeTicketsEnabled
                ? `Purchase limit: ${purchaseLimit} paid ticket(s) per event. Free limit: ${user.freeTicketsQuota} free ticket(s) per event.`
                : 'Your account is active. You can purchase tickets.'}
            </p>
          ) : null}
        </div>
      ) : null}

      {user.verificationStatus === 'VERIFIED' && user.freeTicketsEnabled ? (
        <FreeTicketGenerator
          quota={user.freeTicketsQuota}
        />
      ) : null}

      <h2 className="section-title">My tickets</h2>
      {tickets.length === 0 ? (
        <p className="cart-empty">
          No tickets yet. <Link href="/shop">Buy tickets</Link>
        </p>
      ) : (
        <div className="ticket-grid">
          {tickets.map((t) => {
            const issuance = describeTicketIssuance(t, t.user, t.createdBy ?? t.user);
            return (
              <TicketQrCard
                key={t.id}
                ticketId={t.id}
                productName={t.productName}
                status={t.status}
                holderName={`${t.holderFirstName} ${t.holderLastName}`}
                personalId={t.holderPersonalId}
                issuanceLine={`${issuance.actorNote}: ${issuance.detail}`}
              />
            );
          })}
        </div>
      )}
    </SiteChrome>
  );
}
