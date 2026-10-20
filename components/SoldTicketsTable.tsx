'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ResponsiveTable } from '@/components/ResponsiveTable';

export type SoldTicketRow = {
  id: string;
  productName: string;
  holderFirstName: string;
  holderLastName: string;
  holderPersonalId: string;
  holderEmail: string;
  holderPhone: string;
  accountEmail?: string | null;
  priceGel: number;
  status: string;
  qrToken: string;
};

const COLUMNS = [
  { id: 'event', header: 'Event', mobileSummary: true },
  { id: 'holder', header: 'Holder', mobileSummary: true },
  { id: 'personalId', header: 'Personal ID' },
  { id: 'contact', header: 'Email / Phone' },
  { id: 'price', header: 'Price' },
  { id: 'status', header: 'Status', mobileSummary: true },
  { id: 'actions', header: 'Actions' },
] as const;

function normalizeSearch(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function ticketMatchesSearch(ticket: SoldTicketRow, query: string) {
  if (!query) return true;
  const haystack = [
    ticket.holderFirstName,
    ticket.holderLastName,
    `${ticket.holderFirstName} ${ticket.holderLastName}`,
    ticket.holderPersonalId,
    ticket.holderEmail,
    ticket.holderPhone,
    ticket.accountEmail ?? '',
    ticket.productName,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function SoldTicketsTable({
  tickets: initialTickets,
  totalCount,
}: {
  tickets: SoldTicketRow[];
  totalCount?: number;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const searchNorm = normalizeSearch(search);

  const filtered = useMemo(
    () => tickets.filter((t) => ticketMatchesSearch(t, searchNorm)),
    [tickets, searchNorm],
  );

  async function cancelTicket(ticket: SoldTicketRow) {
    const name = `${ticket.holderFirstName} ${ticket.holderLastName}`.trim();
    const ok = window.confirm(
      `Cancel ticket for ${name} (${ticket.productName})?\n\nUse after a Flitt refund. QR will no longer work at the door.`,
    );
    if (!ok) return;

    setError('');
    setBusyId(ticket.id);
    try {
      const res = await fetch(`/api/admin/tickets/${encodeURIComponent(ticket.id)}/cancel`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not cancel ticket');
        return;
      }
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'CANCELLED' } : t)),
      );
    } catch {
      setError('Network error — try again');
    } finally {
      setBusyId(null);
    }
  }

  const rows = filtered.map((t) => ({
    id: t.id,
    cells: {
      event: t.productName,
      holder: `${t.holderFirstName} ${t.holderLastName}`,
      personalId: t.holderPersonalId,
      contact: (
        <>
          {t.holderEmail}
          <br />
          {t.holderPhone}
        </>
      ),
      price: `${t.priceGel} ₾`,
      status: (
        <span
          className={
            t.status === 'CANCELLED'
              ? 'ticket-status ticket-status--cancelled'
              : t.status === 'USED'
                ? 'ticket-status ticket-status--used'
                : 'ticket-status ticket-status--valid'
          }
        >
          {t.status}
        </span>
      ),
      actions: (
        <div className="admin-ticket-actions">
          <Link href={`/scan/${t.qrToken}`} className="ticket-card__link">
            QR scan →
          </Link>
          {t.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="btn btn--ghost admin-ticket-actions__cancel"
              disabled={busyId === t.id}
              onClick={() => void cancelTicket(t)}
            >
              {busyId === t.id ? '…' : 'Cancel / refund'}
            </button>
          ) : (
            <span className="table-sub">Voided</span>
          )}
        </div>
      ),
    },
  }));

  return (
    <>
      <div className="admin-users-toolbar">
        <label className="admin-users-search form-field">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, personal ID, or email"
            autoComplete="off"
          />
        </label>
      </div>

      <p className="admin-users-meta">
        After a Flitt refund, use <strong>Cancel / refund</strong> so the QR cannot enter.
        {filtered.length === 0
          ? searchNorm
            ? ' · No tickets match your search'
            : ' · No sold tickets yet'
          : searchNorm
            ? ` · ${filtered.length} match${filtered.length === 1 ? '' : 'es'}${filtered.length !== tickets.length ? ` (${tickets.length} loaded)` : ''}`
            : totalCount != null && totalCount > tickets.length
              ? ` · ${filtered.length} shown · ${totalCount} total in database`
              : ` · ${filtered.length} ticket${filtered.length === 1 ? '' : 's'}`}
      </p>

      {error ? <p className="form-error">{error}</p> : null}

      <ResponsiveTable
        columns={[...COLUMNS]}
        rows={rows}
        empty={
          <p className="admin-users-empty">
            {searchNorm ? 'No tickets match. Try another name, ID, or email.' : 'No sold tickets yet.'}
          </p>
        }
      />
    </>
  );
}
