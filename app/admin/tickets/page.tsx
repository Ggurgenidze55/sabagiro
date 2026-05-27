import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Tickets — Admin' };

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true } } },
    take: 200,
  });

  return (
    <>
      <h1 className="page-title">SOLD TICKETS</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Holder</th>
            <th>Personal ID</th>
            <th>Email / Phone</th>
            <th>Price</th>
            <th>Status</th>
            <th>Scan</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.productName}</td>
              <td>
                {t.holderFirstName} {t.holderLastName}
              </td>
              <td>{t.holderPersonalId}</td>
              <td>
                {t.holderEmail}
                <br />
                {t.holderPhone}
              </td>
              <td>{t.priceGel} ₾</td>
              <td>{t.status}</td>
              <td>
                <Link href={`/scan/${t.qrToken}`} className="ticket-card__link" target="_blank">
                  QR scan →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
