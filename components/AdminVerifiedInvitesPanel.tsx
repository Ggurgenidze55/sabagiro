'use client';

import { useEffect, useState } from 'react';

type InviteEventOption = {
  slug: string;
  title: string;
  dayLabel: string;
  dateLabel: string;
  published: boolean;
  isFreeEntry: boolean;
};

export function AdminVerifiedInvitesPanel() {
  const [events, setEvents] = useState<InviteEventOption[]>([]);
  const [eventSlug, setEventSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.events) {
          const eligible = data.events.filter(
            (e: InviteEventOption) => e.isFreeEntry && e.published,
          );
          setEvents(eligible);
          setEventSlug((prev) => prev || eligible[0]?.slug || '');
        }
      })
      .catch(() => setError('Could not load events'));
  }, []);

  const selected = events.find((e) => e.slug === eventSlug);

  async function onSend() {
    if (!eventSlug || !selected) return;
    if (
      !window.confirm(
        `Send invitation emails now to all verified members for "${selected.title}"? Users who already have a ticket or were already emailed are skipped.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/verified-invites/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Dispatch failed');
        return;
      }
      const r = data.result;
      setMsg(
        `${selected.title} — ${r.created} ticket(s) created, ${r.skipped} skipped, ${r.emailsSent} email(s) sent (${r.verifiedUsers} verified users).`,
      );
      if (r.errors?.length) {
        setError(r.errors.slice(0, 3).join(' · '));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-verified-invites">
      <h2 className="section-title">Verified members</h2>
      <p className="page-lead" style={{ marginBottom: '1rem' }}>
        Choose an invitation-only event, then email every verified account one ticket.
      </p>
      <div className="form-stack">
        <label className="form-field">
          <span>Event</span>
          <select
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            disabled={events.length === 0 || busy}
          >
            {events.length === 0 ? (
              <option value="">No invitation-only events — create one in Events</option>
            ) : (
              events.map((ev) => (
                <option key={ev.slug} value={ev.slug}>
                  {ev.title} · {ev.dayLabel} {ev.dateLabel}
                </option>
              ))
            )}
          </select>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {msg ? <p className="form-ok">{msg}</p> : null}
        <button
          type="button"
          className="btn"
          onClick={onSend}
          disabled={busy || !eventSlug || events.length === 0}
        >
          {busy ? 'Sending…' : 'SEND TO ALL VERIFIED'}
        </button>
      </div>
    </section>
  );
}
