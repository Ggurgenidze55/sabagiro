'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { labelsFromEventDate } from '@/lib/event-date-labels';

type ClubEventRow = {
  id: string;
  slug: string;
  title: string;
  about: string;
  imagePath: string;
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

type TierFormRow = { label: string; quantity: number; priceGel: number };

const defaultTiers: TierFormRow[] = [
  { label: 'Wave 1', quantity: 10, priceGel: 35 },
  { label: 'Wave 2', quantity: 10, priceGel: 45 },
  { label: 'Wave 3', quantity: 10, priceGel: 55 },
];

const defaultForm = {
  title: '',
  slug: '',
  about: '',
  imagePath: '',
  lineup: '',
  tag: '',
  dayLabel: '',
  dateLabel: '',
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
  const [tiers, setTiers] = useState<TierFormRow[]>(defaultTiers);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const eventDateRef = useRef<HTMLInputElement>(null);

  function openEventCalendar() {
    const input = eventDateRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  function onEventDateChange(isoDate: string) {
    const labels = labelsFromEventDate(isoDate);
    setForm((prev) => ({
      ...prev,
      eventDate: isoDate,
      dayLabel: labels?.dayLabel ?? prev.dayLabel,
      dateLabel: labels?.dateLabel ?? prev.dateLabel,
    }));
  }

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
    let imagePath = form.imagePath;
    if (imageFile) {
      try {
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await fetch('/api/admin/events/upload-image', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(
            uploadJson.error ||
              `Image upload failed (${uploadRes.status}). Try again or create without image.`,
          );
          return;
        }
        imagePath = uploadJson.path || '';
      } finally {
        setUploadingImage(false);
      }
    }

    const labels = labelsFromEventDate(form.eventDate);
    const payload: Record<string, unknown> = {
      ...form,
      dayLabel: labels?.dayLabel ?? form.dayLabel,
      dateLabel: labels?.dateLabel ?? form.dateLabel,
      imagePath,
      priceGel: Number(tiers[0]?.priceGel ?? form.priceGel),
      sortOrder: Number(form.sortOrder),
      tiers: tiers.map((t) => ({
        label: t.label,
        quantity: Number(t.quantity),
        priceGel: Number(t.priceGel),
      })),
    };
    if (!String(form.slug).trim()) delete payload.slug;

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create');
      return;
    }
    setForm(defaultForm);
    setTiers(defaultTiers);
    setImageFile(null);
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
            <span>About event (shows on event page)</span>
            <textarea
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              placeholder="Write event description, vibe, artists, and details..."
              rows={5}
            />
          </label>
          <label className="form-field form-field--file">
            <span>Event image (will be auto-compressed)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile ? <p className="form-file-name">{imageFile.name}</p> : null}
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
          <div className="event-date-picker">
            <label className="form-field form-field--date">
              <span>Event date</span>
              <div className="event-date-picker__row">
                <input
                  ref={eventDateRef}
                  type="date"
                  className="event-date-picker__input"
                  value={form.eventDate}
                  onChange={(e) => onEventDateChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn--ghost event-date-picker__open"
                  onClick={openEventCalendar}
                >
                  OPEN CALENDAR
                </button>
              </div>
              {form.eventDate && form.dayLabel && form.dateLabel ? (
                <p className="event-date-picker__preview">
                  Displays as <strong>{form.dayLabel}</strong> · <strong>{form.dateLabel}</strong>
                </p>
              ) : (
                <p className="form-foot">Choose a date — day name and label fill in automatically.</p>
              )}
            </label>
          </div>
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

          <div className="tier-editor">
            <h3 className="section-title">Ticket waves (qty + price per wave)</h3>
            {tiers.map((tier, index) => (
              <div key={index} className="form-row tier-editor__row">
                <label className="form-field">
                  <span>Label</span>
                  <input
                    value={tier.label}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[index] = { ...tier, label: e.target.value };
                      setTiers(next);
                    }}
                  />
                </label>
                <label className="form-field">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={tier.quantity}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[index] = { ...tier, quantity: Number(e.target.value) };
                      setTiers(next);
                    }}
                  />
                </label>
                <label className="form-field">
                  <span>Price ₾</span>
                  <input
                    type="number"
                    min={0}
                    value={tier.priceGel}
                    onChange={(e) => {
                      const next = [...tiers];
                      next[index] = { ...tier, priceGel: Number(e.target.value) };
                      setTiers(next);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setTiers(tiers.filter((_, i) => i !== index))}
                  disabled={tiers.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setTiers([...tiers, { label: `Wave ${tiers.length + 1}`, quantity: 10, priceGel: 50 }])}
            >
              + Add wave
            </button>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {msg ? <p className="form-ok">{msg}</p> : null}
          <button type="submit" className="btn" disabled={uploadingImage}>
            {uploadingImage ? 'UPLOADING IMAGE…' : 'CREATE EVENT'}
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
        <div className="table-scroll">
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
                  {ev.imagePath ? (
                    <>
                      <br />
                      <span className="table-sub">image: yes</span>
                    </>
                  ) : null}
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
        </div>
      </section>
    </div>
  );
}
