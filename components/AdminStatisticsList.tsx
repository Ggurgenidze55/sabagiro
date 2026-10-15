import Link from 'next/link';
import type { EventStatisticsListRow } from '@/lib/event-statistics';

function formatDate(row: EventStatisticsListRow) {
  const parts = [row.dayLabel, row.dateLabel].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return row.eventDate ?? '—';
}

export function AdminStatisticsList({ rows }: { rows: EventStatisticsListRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="cart-empty">
        No statistics yet — numbers appear after tickets are issued and are kept after ticket cleanup.
      </p>
    );
  }

  return (
    <div className="admin-promo-stats__table-wrap">
      <table className="admin-promo-stats__table admin-statistics-list">
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Date</th>
            <th scope="col">Invitations</th>
            <th scope="col">Paid</th>
            <th scope="col">Promo tickets</th>
            <th scope="col">Revenue (₾)</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = row.hasLiveTickets
              ? row.finalizedAt
                ? 'Live + saved'
                : 'Live'
              : row.finalizedAt
                ? 'Archived'
                : 'Saved';
            return (
              <tr key={row.eventSlug}>
                <td>
                  <Link href={`/admin/statistics/${encodeURIComponent(row.eventSlug)}`}>
                    {row.eventTitle}
                  </Link>
                  <br />
                  <span className="table-sub">/events/{row.eventSlug}</span>
                </td>
                <td>{formatDate(row)}</td>
                <td>{row.ticketStats.invite.total}</td>
                <td className="admin-ticket-stats__accent">{row.ticketStats.paid.total}</td>
                <td>{row.promoTicketsSold}</td>
                <td>{row.paidRevenueGel}</td>
                <td>
                  {status}
                  {row.computedAt ? (
                    <>
                      <br />
                      <span className="table-sub">
                        updated {row.computedAt.toLocaleString('en-GB', { timeZone: 'Asia/Tbilisi' })}
                      </span>
                    </>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
