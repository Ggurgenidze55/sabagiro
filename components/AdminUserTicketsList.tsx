import Link from 'next/link';
import {
  adminTicketStatusDisplay,
  ticketSourceLabel,
  type AdminUserTicketRow,
} from '@/lib/admin-user-ticket';

type AdminUserTicketsListProps = {
  tickets: AdminUserTicketRow[];
};

export function AdminUserTicketsList({ tickets }: AdminUserTicketsListProps) {
  if (tickets.length === 0) {
    return <p className="admin-user-tickets__empty">No tickets for this user.</p>;
  }

  const used = tickets.filter((t) => t.status === 'USED').length;
  const valid = tickets.filter((t) => t.status === 'VALID').length;
  const cancelled = tickets.filter((t) => t.status === 'CANCELLED').length;

  return (
    <div className="admin-user-tickets">
      <p className="admin-user-tickets__summary">
        {tickets.length} total · {valid} not scanned · {used} used · {cancelled} cancelled
      </p>
      <div className="table-scroll admin-user-tickets__scroll">
        <table className="data-table data-table--compact">
          <thead>
            <tr>
              <th>Event</th>
              <th>Tier</th>
              <th>Price</th>
              <th>Source</th>
              <th>Status</th>
              <th>Scan</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const status = adminTicketStatusDisplay(t);
              return (
                <tr key={t.id}>
                  <td>
                    {t.productName}
                    {t.eventDate ? (
                      <>
                        <br />
                        <span className="table-sub">{t.eventDate}</span>
                      </>
                    ) : null}
                  </td>
                  <td>{t.tierLabel || '—'}</td>
                  <td>{t.priceGel} ₾</td>
                  <td>{ticketSourceLabel(t.source)}</td>
                  <td>
                    <span className={`ticket-status ticket-status--${status.tone}`}>
                      {status.label}
                    </span>
                    <br />
                    <span className="table-sub">{status.detail}</span>
                  </td>
                  <td>
                    <Link href={`/scan/${t.qrToken}`} className="ticket-card__link" target="_blank">
                      Open scan
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
