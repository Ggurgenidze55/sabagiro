import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScanDoorCheck } from '@/components/ScanDoorCheck';
import { ScanVerdict } from '@/components/ScanVerdict';
import { getSessionUser } from '@/lib/auth';
import { canScanAtDoor } from '@/lib/door-scan';
import { prisma } from '@/lib/db';
import { getPublishedEventBySlug } from '@/lib/events';
import { describeTicketIssuance } from '@/lib/ticket-issuance';
import { getScanVerdict } from '@/lib/ticket-scan';
import { canAccessTicketQr, ticketQrContext } from '@/lib/ticket-qr-access';
import { qrDataUrl } from '@/lib/qr';

type PageProps = { params: { token: string } };

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Ticket scan — Sabagiro' };

export default async function ScanPage({ params }: PageProps) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: params.token },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  });

  if (!ticket) notFound();

  const user = await getSessionUser();
  const canDoorScan = user ? canScanAtDoor(user) : false;
  const event = ticket.eventDate ? null : await getPublishedEventBySlug(ticket.productSlug);
  const eventDatesBySlug: Record<string, string | null | undefined> = event
    ? { [ticket.productSlug]: event.eventDate }
    : {};
  const ctx = ticketQrContext(ticket, eventDatesBySlug);
  const qrAvailable = canAccessTicketQr(ctx, canDoorScan);
  const qrExpired = !qrAvailable && ticket.status === 'VALID';
  const verdict = getScanVerdict(ticket.status, ticket.scannedAt, qrExpired && !canDoorScan);
  const showHolderDetails = canDoorScan || ticket.status === 'VALID';
  const issuance = describeTicketIssuance(
    ticket,
    ticket.user,
    ticket.createdBy ?? ticket.user,
  );

  const qrImage =
    ticket.status === 'VALID' && qrAvailable ? await qrDataUrl(ticket.qrToken) : null;

  return (
    <div className="scan-page">
      <div className={`scan-card scan-card--${verdict.tone}`}>
        <Link href="/" className="back-link scan-card__back">
          ← Sabagiro
        </Link>
        <p className="scan-card__label">SABAGIRO · DOOR CHECK</p>

        <ScanVerdict verdict={verdict} />

        <h1 className="scan-card__event">{ticket.productName}</h1>
        {ticket.tierLabel ? <p className="scan-card__tier">{ticket.tierLabel}</p> : null}

        {showHolderDetails ? (
          <dl className="scan-details">
            <div>
              <dt>{issuance.holderNote}</dt>
              <dd>
                {ticket.holderFirstName} {ticket.holderLastName}
              </dd>
            </div>
            <div>
              <dt>Personal ID</dt>
              <dd>{ticket.holderPersonalId}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{ticket.holderEmail}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{ticket.holderPhone}</dd>
            </div>
            <div>
              <dt>{issuance.actorNote}</dt>
              <dd>{issuance.detail}</dd>
            </div>
            <div>
              <dt>Owner Account</dt>
              <dd>
                {issuance.ownerLabel} · {ticket.user.email}
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{ticket.priceGel > 0 ? `${ticket.priceGel} ₾` : 'Free'}</dd>
            </div>
          </dl>
        ) : (
          <p className="scan-door-hint">Details are hidden after scan.</p>
        )}

        {qrImage ? (
          <img src={qrImage} alt="Ticket QR" className="ticket-card__qr" width={200} height={200} />
        ) : null}

        <ScanDoorCheck
          qrToken={ticket.qrToken}
          status={ticket.status}
          canCheckIn={canDoorScan && qrAvailable}
          qrExpired={qrExpired && !canDoorScan}
        />
      </div>
    </div>
  );
}
