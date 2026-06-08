'use client';

import { useState } from 'react';
import type { AdminUserRow } from '@/components/AdminUsersPanel';
import { IntInput } from '@/components/IntInput';
import { isProtectedStaffTarget } from '@/lib/staff-roles';

type AdminUserTicketPolicyFormProps = {
  user: AdminUserRow;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
  onSaved?: () => void;
};

export function AdminUserTicketPolicyForm({ user, onUpdated, onSaved }: AdminUserTicketPolicyFormProps) {
  const [ticketLimitPerEvent, setTicketLimitPerEvent] = useState(user.ticketLimitPerEvent);
  const [freeTicketsEnabled, setFreeTicketsEnabled] = useState(user.freeTicketsEnabled);
  const [freeTicketsQuota, setFreeTicketsQuota] = useState(user.freeTicketsQuota);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

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
      if (data.email?.sent) {
        setMsg('Saved — user notified');
      } else if (data.email?.skipped) {
        setMsg('Saved (email skipped)');
      } else {
        setMsg('Saved');
      }
      onSaved?.();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-stack user-policy__form user-policy__form--inline" onSubmit={save}>
      <label className="form-field">
        <span>Paid limit / event</span>
        <IntInput
          min={0}
          max={20}
          value={ticketLimitPerEvent}
          onChange={setTicketLimitPerEvent}
          required
        />
      </label>
      <label className="form-check">
        <input
          type="checkbox"
          checked={freeTicketsEnabled}
          onChange={(e) => {
            const on = e.target.checked;
            setFreeTicketsEnabled(on);
            if (!on) setFreeTicketsQuota(0);
            else if (freeTicketsQuota < 1) setFreeTicketsQuota(Math.max(1, user.freeTicketsQuota || 1));
          }}
        />
        <span>Free tickets enabled</span>
      </label>
      <label className="form-field">
        <span>Free quota / event</span>
        <IntInput
          min={1}
          max={500}
          value={freeTicketsQuota}
          onChange={setFreeTicketsQuota}
          disabled={!freeTicketsEnabled}
        />
      </label>
      <p className="form-foot">
        Total issued: {user.freeTicketsUsed} · Quota: {user.freeTicketsQuota} per event
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}
      <button type="submit" className="btn" disabled={saving}>
        {saving ? '…' : 'Save'}
      </button>
    </form>
  );
}

/** @deprecated Use AdminUserActionsMenu dropdown instead */
export function AdminUserTicketPolicy({
  user,
  onUpdated,
}: {
  user: AdminUserRow;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
}) {
  if (isProtectedStaffTarget(user.role) || user.verificationStatus !== 'VERIFIED') {
    return null;
  }
  return <AdminUserTicketPolicyForm user={user} onUpdated={onUpdated} />;
}
