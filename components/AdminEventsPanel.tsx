'use client';

import { useCallback, useEffect, useState } from 'react';

type ClubEventRow = {
  id: string;
  slug: string;
  title: string;
  lineup: string;
  tag: string;
  dayLabel: string;
  dateLabel: string;
  eventDate: string | null;
  accent: string;
  priceGel: number;
  isFeatured: boolean;
  published: boolean;
  sortOrder: number;
};

const defaultForm = {
  title: '',
  slug: '',
  lineup: '',
  tag: '',
  dayLabel: 'SAT',
  dateLabel: '01 JAN',
  eventDate: '',
  accent: '#c8ff00',
  priceGel: 45,
  isFeatured: false,
  published: true,
  sortOrder: 0,
};

export function AdminEventsPanel() {
  const [events, setEvents] = useState<ClubEventRow[]>([]);
  const [season, setSeason] = useState('Summer 2025');
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [evRes, seasonRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/events/season'),
      ]);
      const evData = await evRes.json().catch(() => ({}));
      const seasonData = await seasonRes.json().catch(() => ({}));
      if (!evRes.ok) {
        setError(evData.error || 'Could not load events');
        return;
      }
      if (evRes.ok) setEvents(evData.events ?? []);
      if (seasonRes.ok) setSeason(seasonData.season ?? season);
    } catch {
      setError('Network error loading events');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSeason(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/events/season', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to update season');
        return;
      }
      setMsg('Season label updated on homepage');
    } catch {
      setError('Network error');
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        priceGel: Number(form.priceGel),
        sortOrder: Number(form.sortOrder),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create');
      return;
    }
    setForm(defaultForm);
    setMsg('Event created — visible on homepage & shop');
    load();
  }

  async function togglePublished(ev: ClubEventRow) {
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !ev.published }),
    });
    load();
  }

  async function removeEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="admin-events">
      <section className="admin-events__section">
        <h2 className="section-title">Homepage season</h2>
        <form className="form-stack form-stack--inline" onSubmit={saveSeason}>
          <label className="form-field">
            <span>Label (e.g. Summer 2025)</span>
            <input value={season} onChange={(e) => setSeason(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn--ghost">
            SAVE SEASON
          </button>
        </form>
      </section>

      <section className="admin-events__section">
        <h2 className="section-title">New event</h2>
        <form className="form-stack" onSubmit={createEvent}>
          <label className="form-field">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="CONCRETE OPENING"
            />
          </label>
          <label className="form-field">
            <span>Slug (optional — latin, no spaces)</span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={
                form.title
                  ? form.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                  : 'auto-from-title'
              }
            />
          </label>
          <label className="form-field">
            <span>Lineup</span>
            <input
              value={form.lineup}
              onChange={(e) => setForm({ ...form, lineup: e.target.value })}
              placeholder="NDRX · KIAI"
            />
          </label>
          <label className="form-field">
            <span>Tag / venue</span>
            <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Day (SAT)</span>
              <input
                value={form.dayLabel}
                onChange={(e) => setForm({ ...form, dayLabel: e.target.value })}
                required
              />
            </label>
            <label className="form-field">
              <span>Date (31 MAY)</span>
              <input
                value={form.dateLabel}
                onChange={(e) => setForm({ ...form, dateLabel: e.target.value })}
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>ISO date (optional)</span>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Accent</span>
              <input
                type="color"
                value={form.accent}
                onChange={(e) => setForm({ ...form, accent: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Price (₾)</span>
              <input
                type="number"
                min={0}
                value={form.priceGel}
                onChange={(e) => setForm({ ...form, priceGel: Number(e.target.value) })}
              />
            </label>
            <label className="form-field">
              <span>Sort order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Featured (highlighted on homepage)
          </label>
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {msg ? <p className="form-ok">{msg}</p> : null}
          <button type="submit" className="btn">
            CREATE EVENT
          </button>
        </form>
      </section>

      <section className="admin-events__section">
        <h2 className="section-title">All events</h2>
        <p className="page-lead" style={{ marginBottom: '1rem' }}>
          If homepage links show 404, click to fix old slugs (spaces → hyphens).
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ marginBottom: '1rem' }}
          onClick={async () => {
            const res = await fetch('/api/admin/events/normalize-slugs', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || 'Failed');
              return;
            }
            setMsg(
              data.updated?.length
                ? `Fixed slugs: ${data.updated.join(', ')}`
                : 'All slugs already OK',
            );
            load();
          }}
        >
          FIX EVENT SLUGS
        </button>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>
                  {ev.title}
                  <br />
                  <span className="table-sub">/shop/{ev.slug}</span>
                </td>
                <td>
                  {ev.dayLabel} {ev.dateLabel}
                </td>
                <td>{ev.priceGel} ₾</td>
                <td>
                  {ev.published ? 'Live' : 'Hidden'}
                  {ev.isFeatured ? ' · ★' : ''}
                </td>
                <td className="table-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => togglePublished(ev)}>
                    {ev.published ? 'Hide' : 'Publish'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => removeEvent(ev.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
