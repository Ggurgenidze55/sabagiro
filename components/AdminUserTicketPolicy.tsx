'use client';

import { useState } from 'react';
import type { AdminUserRow } from '@/components/AdminUsersPanel';

type AdminUserTicketPolicyProps = {
  user: AdminUserRow;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
};

export function AdminUserTicketPolicy({ user, onUpdated }: AdminUserTicketPolicyProps) {
  const [open, setOpen] = useState(false);
  const [ticketLimitPerEvent, setTicketLimitPerEvent] = useState(user.ticketLimitPerEvent);
  const [freeTicketsEnabled, setFreeTicketsEnabled] = useState(user.freeTicketsEnabled);
  const [freeTicketsQuota, setFreeTicketsQuota] = useState(user.freeTicketsQuota);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  if (user.role === 'ADMIN' || user.verificationStatus !== 'VERIFIED') {
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ticket-policy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketLimitPerEvent,
          freeTicketsEnabled,
          freeTicketsQuota,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save settings');
        return;
      }
      onUpdated({
        ticketLimitPerEvent,
        freeTicketsEnabled,
        freeTicketsQuota,
        freeTicketsUsed: data.user?.freeTicketsUsed ?? user.freeTicketsUsed,
      });
      setMsg('Policy saved');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="user-policy">
      <button type="button" className="btn btn--ghost" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close' : 'Limits / Free Tickets'}
      </button>
      {open ? (
        <form className="form-stack user-policy__form" onSubmit={save}>
          <label className="form-field">
            <span>Paid ticket limit per event</span>
            <input
              type="number"
              min={0}
              max={20}
              value={ticketLimitPerEvent}
              onChange={(e) => setTicketLimitPerEvent(Number(e.target.value))}
              required
            />
          </label>
          <label className="form-check">
            <input
              type="checkbox"
              checked={freeTicketsEnabled}
              onChange={(e) => setFreeTicketsEnabled(e.target.checked)}
            />
            <span>Enable free ticket generation</span>
          </label>
          <label className="form-field">
            <span>Free tickets per event (quota)</span>
            <input
              type="number"
              min={user.freeTicketsUsed}
              max={500}
              value={freeTicketsQuota}
              onChange={(e) => setFreeTicketsQuota(Number(e.target.value))}
              disabled={!freeTicketsEnabled}
            />
          </label>
          <p className="form-foot">
            Total free tickets issued: {user.freeTicketsUsed} · Remaining now:{' '}
            {Math.max(0, freeTicketsQuota - user.freeTicketsUsed)}
          </p>
          {error ? <p className="form-error">{error}</p> : null}
          {msg ? <p className="form-ok">{msg}</p> : null}
          <button type="submit" className="btn btn--ghost" disabled={saving}>
            {saving ? '…' : 'Save'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
