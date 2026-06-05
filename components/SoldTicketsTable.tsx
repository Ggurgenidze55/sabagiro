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
  { id: 'status', header: 'Status' },
  { id: 'scan', header: 'Scan' },
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

export function SoldTicketsTable({ tickets }: { tickets: SoldTicketRow[] }) {
  const [search, setSearch] = useState('');
  const searchNorm = normalizeSearch(search);

  const filtered = useMemo(
    () => tickets.filter((t) => ticketMatchesSearch(t, searchNorm)),
    [tickets, searchNorm],
  );

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
      status: t.status,
      scan: (
        <Link href={`/scan/${t.qrToken}`} className="ticket-card__link">
          QR scan →
        </Link>
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
        {filtered.length === 0
          ? searchNorm
            ? 'No tickets match your search'
            : 'No sold tickets yet'
          : searchNorm
            ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}${filtered.length !== tickets.length ? ` (${tickets.length} loaded)` : ''}`
            : `${filtered.length} ticket${filtered.length === 1 ? '' : 's'}`}
      </p>

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
