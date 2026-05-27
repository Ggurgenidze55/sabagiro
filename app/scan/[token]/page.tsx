import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScanDoorActions } from '@/components/ScanDoorActions';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { qrDataUrl } from '@/lib/qr';

type PageProps = { params: { token: string } };

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Ticket scan — Sabagiro' };

export default async function ScanPage({ params }: PageProps) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: params.token },
  });

  if (!ticket) notFound();

  const qrImage = await qrDataUrl(ticket.qrToken);
  const user = await getSessionUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="scan-page">
      <div className="scan-card">
        <Link href="/" className="back-link scan-card__back">
          ← Sabagiro
        </Link>
        <p className="scan-card__label">SABAGIRO · TICKET CHECK</p>
        <h1 className="scan-card__event">{ticket.productName}</h1>
        <p className={`ticket-status ticket-status--${ticket.status.toLowerCase()}`}>{ticket.status}</p>

        <dl className="scan-details">
          <div>
            <dt>First name</dt>
            <dd>{ticket.holderFirstName}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{ticket.holderLastName}</dd>
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
        </dl>

        <img src={qrImage} alt="Ticket QR" className="ticket-card__qr" width={240} height={240} />

        {isAdmin ? <ScanDoorActions qrToken={ticket.qrToken} status={ticket.status} /> : null}
      </div>
    </div>
  );
}
