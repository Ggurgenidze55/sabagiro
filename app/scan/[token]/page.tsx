import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScanDoorCheck } from '@/components/ScanDoorCheck';
import { ScanVerdict } from '@/components/ScanVerdict';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getScanVerdict } from '@/lib/ticket-scan';
import { qrDataUrl } from '@/lib/qr';

type PageProps = { params: { token: string } };

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Ticket scan — Sabagiro' };

export default async function ScanPage({ params }: PageProps) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: params.token },
  });

  if (!ticket) notFound();

  const user = await getSessionUser();
  const isAdmin = user?.role === 'ADMIN';
  const verdict = getScanVerdict(ticket.status, ticket.scannedAt);
  const showHolderDetails = isAdmin || ticket.status === 'VALID';

  const qrImage = ticket.status === 'VALID' ? await qrDataUrl(ticket.qrToken) : null;

  return (
    <div className="scan-page">
      <div className={`scan-card scan-card--${verdict.tone}`}>
        <Link href="/" className="back-link scan-card__back">
          ← Sabagiro
        </Link>
        <p className="scan-card__label">SABAGIRO · DOOR CHECK</p>

        <ScanVerdict verdict={verdict} />

        <h1 className="scan-card__event">{ticket.productName}</h1>
        {ticket.tierLabel ? (
          <p className="scan-card__tier">{ticket.tierLabel}</p>
        ) : null}

        {showHolderDetails ? (
          <dl className="scan-details">
            <div>
              <dt>Name</dt>
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
              <dt>Price paid</dt>
              <dd>{ticket.priceGel} ₾</dd>
            </div>
          </dl>
        ) : (
          <p className="scan-door-hint">Ticket details hidden after scan.</p>
        )}

        {qrImage ? (
          <img src={qrImage} alt="Ticket QR" className="ticket-card__qr" width={200} height={200} />
        ) : null}

        <ScanDoorCheck qrToken={ticket.qrToken} status={ticket.status} canCheckIn={isAdmin} />
      </div>
    </div>
  );
}
