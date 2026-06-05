'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type EventOption = { slug: string; title: string };

type FreeTicketGeneratorProps = {
  quota: number;
  usedByEvent: Record<string, number>;
};

export function FreeTicketGenerator({ quota, usedByEvent }: FreeTicketGeneratorProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [localUsedByEvent, setLocalUsedByEvent] = useState(usedByEvent);

  useEffect(() => {
    setLocalUsedByEvent(usedByEvent);
  }, [usedByEvent]);

  useEffect(() => {
    fetch('/api/account/free-tickets/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events) {
          const list = d.events.map((e: { slug: string; title: string }) => ({
            slug: e.slug,
            title: e.title,
          }));
          setEvents(list);
          setSelectedSlug((prev) => prev || list[0]?.slug || '');
        }
      })
      .catch(() => setError('Could not load free-entry events'));
  }, []);

  const remainingForSelected = useMemo(() => {
    if (!selectedSlug) return quota;
    const used = localUsedByEvent[selectedSlug] ?? 0;
    return Math.max(0, quota - used);
  }, [localUsedByEvent, quota, selectedSlug]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError('');
    setMsg('');
    setLoading(true);
    const fd = new FormData(form);
    const productSlug = String(fd.get('productSlug') || '');
    try {
      const res = await fetch('/api/account/free-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not generate ticket');
        return;
      }
      setMsg('Free ticket created. QR is now visible in My Tickets.');
      if (productSlug) {
        setLocalUsedByEvent((prev) => ({
          ...prev,
          [productSlug]: (prev[productSlug] ?? 0) + 1,
        }));
      }
      form.reset();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message.includes('fetch') ? 'Network error — check connection' : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="section-title section-title--flush">Free Ticket Generator</h2>
      <p className="page-lead" style={{ marginBottom: '0.5rem' }}>
        Free-entry events only · {quota} ticket(s) per event.
      </p>
      <p className="page-lead" style={{ marginBottom: '1rem', color: 'var(--acid, #f9c108)' }}>
        {selectedSlug
          ? `Remaining for selected event: ${remainingForSelected} / ${quota}`
          : `Remaining: ${quota} / ${quota}`}
      </p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="form-field">
          <span>Event</span>
          <select
            name="productSlug"
            required
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            {events.length === 0 ? (
              <option value="">No free-entry events published</option>
            ) : (
              events.map((ev) => {
                const used = localUsedByEvent[ev.slug] ?? 0;
                const left = Math.max(0, quota - used);
                return (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title} ({left} left)
                  </option>
                );
              })
            )}
          </select>
        </label>
        <label className="form-field">
          <span>Holder first name</span>
          <input name="firstName" required minLength={2} />
        </label>
        <label className="form-field">
          <span>Holder last name</span>
          <input name="lastName" required minLength={2} />
        </label>
        <label className="form-field">
          <span>Personal ID</span>
          <input name="personalId" required pattern="\d{11}" inputMode="numeric" />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        <label className="form-field">
          <span>Phone</span>
          <input name="phone" required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {msg ? <p className="form-ok">{msg}</p> : null}
        {remainingForSelected <= 0 && selectedSlug ? (
          <p className="form-error">Free ticket limit reached for this event.</p>
        ) : null}
        <button
          type="submit"
          className="btn"
          disabled={loading || events.length === 0 || remainingForSelected <= 0}
        >
          {loading ? '…' : 'Generate Free Ticket'}
        </button>
      </form>
    </section>
  );
}
