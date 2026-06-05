import Link from 'next/link';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import {
  adminTicketStatusDisplay,
  ticketSourceLabel,
  type AdminUserTicketRow,
} from '@/lib/admin-user-ticket';

type AdminUserTicketsListProps = {
  tickets: AdminUserTicketRow[];
};

const COLUMNS = [
  { id: 'event', header: 'Event', mobileSummary: true },
  { id: 'tier', header: 'Tier' },
  { id: 'price', header: 'Price' },
  { id: 'source', header: 'Source' },
  { id: 'status', header: 'Status', mobileSummary: true },
  { id: 'scan', header: 'Scan' },
] as const;

export function AdminUserTicketsList({ tickets }: AdminUserTicketsListProps) {
  if (tickets.length === 0) {
    return <p className="admin-user-tickets__empty">No tickets for this user.</p>;
  }

  const used = tickets.filter((t) => t.status === 'USED').length;
  const valid = tickets.filter((t) => t.status === 'VALID').length;
  const cancelled = tickets.filter((t) => t.status === 'CANCELLED').length;

  const rows = tickets.map((t) => {
    const status = adminTicketStatusDisplay(t);
    return {
      id: t.id,
      cells: {
        event: (
          <>
            {t.productName}
            {t.eventDate ? (
              <>
                <br />
                <span className="table-sub">{t.eventDate}</span>
              </>
            ) : null}
          </>
        ),
        tier: t.tierLabel || '—',
        price: `${t.priceGel} ₾`,
        source: ticketSourceLabel(t.source),
        status: (
          <>
            <span className={`ticket-status ticket-status--${status.tone}`}>{status.label}</span>
            <br />
            <span className="table-sub">{status.detail}</span>
          </>
        ),
        scan: (
          <Link href={`/scan/${t.qrToken}`} className="ticket-card__link" target="_blank">
            Open scan
          </Link>
        ),
      },
    };
  });

  return (
    <div className="admin-user-tickets">
      <p className="admin-user-tickets__summary">
        {tickets.length} total · {valid} not scanned · {used} used · {cancelled} cancelled
      </p>
      <ResponsiveTable columns={[...COLUMNS]} rows={rows} tableClassName="data-table data-table--compact" />
    </div>
  );
}
