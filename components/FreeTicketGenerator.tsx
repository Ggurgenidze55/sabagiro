'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EventOption = { slug: string; title: string };

type FreeTicketGeneratorProps = {
  quota: number;
};

export function FreeTicketGenerator({ quota }: FreeTicketGeneratorProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events) {
          setEvents(
            d.events.map((e: { slug: string; title: string }) => ({ slug: e.slug, title: e.title })),
          );
        }
      })
      .catch(() => setError('Could not load events'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
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
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="section-title">Free Ticket Generator</h2>
      <p className="page-lead" style={{ marginBottom: '1rem' }}>
        Free limit: {quota} tickets per event. Fill in holder details below.
      </p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="form-field">
          <span>Event</span>
          <select name="productSlug" required defaultValue={events[0]?.slug}>
            {events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map((ev) => (
                <option key={ev.slug} value={ev.slug}>
                  {ev.title}
                </option>
              ))
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
        <button type="submit" className="btn" disabled={loading || events.length === 0}>
          {loading ? '…' : 'Generate Free Ticket'}
        </button>
      </form>
    </section>
  );
}
