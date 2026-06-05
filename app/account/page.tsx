import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { TicketQrCard } from '@/components/TicketQrCard';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { describeTicketIssuance } from '@/lib/ticket-issuance';
import { getTicketLimitPerEvent } from '@/lib/ticket-purchase-limit';
import {
  canAccessTicketQr,
  getQrExpiryMs,
  qrExpiredMessage,
  ticketQrContext,
} from '@/lib/ticket-qr-access';
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

  const adminBypass = user.role === 'ADMIN';
  const slugs = [...new Set(tickets.map((t) => t.productSlug))];
  const events =
    slugs.length > 0
      ? await prisma.clubEvent.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, eventDate: true },
        })
      : [];
  const eventDatesBySlug = Object.fromEntries(events.map((e) => [e.slug, e.eventDate])) as Record<
    string,
    string | null | undefined
  >;

  const sortedTickets = [...tickets].sort((a, b) => {
    const ctxA = ticketQrContext(a, eventDatesBySlug);
    const ctxB = ticketQrContext(b, eventDatesBySlug);
    const archivedA = !canAccessTicketQr(ctxA, adminBypass);
    const archivedB = !canAccessTicketQr(ctxB, adminBypass);
    if (archivedA !== archivedB) return archivedA ? 1 : -1;
    const expiryA = getQrExpiryMs(ctxA) ?? 0;
    const expiryB = getQrExpiryMs(ctxB) ?? 0;
    return expiryB - expiryA;
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
        {user.role === 'ADMIN' ? (
          <div className="dash-head__actions">
            <Link href="/admin" className="btn">
              Admin
            </Link>
          </div>
        ) : null}
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

      <SectionDivider />
      <h2 className="section-title section-title--flush">My tickets</h2>
      {tickets.length === 0 ? (
        <p className="cart-empty">
          No tickets yet. <Link href="/events">Browse events</Link>
        </p>
      ) : (
        <div className="ticket-grid">
          {sortedTickets.map((t) => {
            const issuance = describeTicketIssuance(t, t.user, t.createdBy ?? t.user);
            const ctx = ticketQrContext(t, eventDatesBySlug);
            const qrAvailable = canAccessTicketQr(ctx, adminBypass);
            return (
              <TicketQrCard
                key={t.id}
                ticketId={t.id}
                productName={t.productName}
                status={t.status}
                holderName={`${t.holderFirstName} ${t.holderLastName}`}
                personalId={t.holderPersonalId}
                issuanceLine={`${issuance.actorNote}: ${issuance.detail}`}
                qrAvailable={qrAvailable}
                expiredMessage={qrExpiredMessage()}
              />
            );
          })}
        </div>
      )}
    </SiteChrome>
  );
}
