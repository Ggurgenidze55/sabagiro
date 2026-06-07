'use client';

import { ResponsiveTable } from '@/components/ResponsiveTable';
import { SectionDivider } from '@/components/SectionDivider';

import { useCallback, useEffect, useRef, useState } from 'react';
import { labelsFromEventDate } from '@/lib/event-date-labels';

type TicketTierRow = { label: string; quantity: number; priceGel: number };

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
  isFreeEntry: boolean;
  freeEntryAccess: 'ALL_VERIFIED' | 'INVITED_ONLY';
  artistTicketsEnabled: boolean;
  isFeatured: boolean;
  published: boolean;
  sortOrder: number;
  ticketTiers?: TicketTierRow[];
};

type TierFormRow = { label: string; quantity: number; priceGel: number };

const defaultTiers: TierFormRow[] = [
  { label: 'Wave 1', quantity: 10, priceGel: 35 },
  { label: 'Wave 2', quantity: 10, priceGel: 45 },
  { label: 'Wave 3', quantity: 10, priceGel: 55 },
];

const defaultFormBase = {
  title: '',
  slug: '',
  about: '',
  imagePath: '',
  lineup: '',
  tag: '',
  dayLabel: '',
  dateLabel: '',
  eventDate: '',
  accent: '#f9c108',
  priceGel: 45,
  isFreeEntry: false,
  isFeatured: false,
  published: true,
  sortOrder: 0,
};

const defaultForm: typeof defaultFormBase & {
  freeEntryAccess: 'ALL_VERIFIED' | 'INVITED_ONLY';
  artistTicketsEnabled: boolean;
} = {
  ...defaultFormBase,
  freeEntryAccess: 'INVITED_ONLY',
  artistTicketsEnabled: false,
};

function tiersFromEvent(ev: ClubEventRow): TierFormRow[] {
  if (ev.ticketTiers?.length) {
    return ev.ticketTiers.map((t) => ({
      label: t.label,
      quantity: t.quantity,
      priceGel: t.priceGel,
    }));
  }
  return [{ label: 'Standard', quantity: 100, priceGel: ev.priceGel }];
}

export function AdminEventsPanel() {
  const [events, setEvents] = useState<ClubEventRow[]>([]);
  const [season, setSeason] = useState('Summer 2025');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [tiers, setTiers] = useState<TierFormRow[]>(defaultTiers);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const eventDateRef = useRef<HTMLInputElement>(null);
  const eventFormRef = useRef<HTMLFormElement>(null);

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

  function resetEventForm() {
    setEditingId(null);
    setForm(defaultForm);
    setTiers(defaultTiers);
    setImageFile(null);
  }

  function startEdit(ev: ClubEventRow) {
    setEditingId(ev.id);
    setError('');
    setMsg('');
    setImageFile(null);
    setForm({
      title: ev.title,
      slug: ev.slug,
      about: ev.about,
      imagePath: ev.imagePath,
      lineup: ev.lineup,
      tag: ev.tag,
      dayLabel: ev.dayLabel,
      dateLabel: ev.dateLabel,
      eventDate: ev.eventDate ?? '',
      accent: ev.accent,
      priceGel: ev.priceGel,
      isFreeEntry: ev.isFreeEntry,
      freeEntryAccess: ev.freeEntryAccess ?? 'INVITED_ONLY',
      artistTicketsEnabled: ev.artistTicketsEnabled ?? false,
      isFeatured: ev.isFeatured,
      published: ev.published,
      sortOrder: ev.sortOrder,
    });
    setTiers(ev.isFreeEntry ? [{ label: 'Free entry', quantity: 9999, priceGel: 0 }] : tiersFromEvent(ev));
    requestAnimationFrame(() => {
      eventFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function saveEvent(e: React.FormEvent) {
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
      priceGel: form.isFreeEntry ? 0 : Number(tiers[0]?.priceGel ?? form.priceGel),
      isFreeEntry: form.isFreeEntry,
      freeEntryAccess: form.isFreeEntry ? form.freeEntryAccess : 'INVITED_ONLY',
      artistTicketsEnabled: form.artistTicketsEnabled,
      sortOrder: Number(form.sortOrder),
      tiers: form.isFreeEntry
        ? [{ label: 'Free entry', quantity: 9999, priceGel: 0 }]
        : tiers.map((t) => ({
        label: t.label,
        quantity: Number(t.quantity),
        priceGel: Number(t.priceGel),
      })),
    };
    if (!String(form.slug).trim()) delete payload.slug;

    const res = await fetch(editingId ? `/api/admin/events/${editingId}` : '/api/admin/events', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || (editingId ? 'Failed to update' : 'Failed to create'));
      return;
    }
    const wasEdit = Boolean(editingId);
    resetEventForm();
    setMsg(wasEdit ? 'Event updated' : 'Event created — visible on homepage & events');
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

  async function toggleFreeEntry(ev: ClubEventRow) {
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFreeEntry: !ev.isFreeEntry }),
    });
    load();
  }

  async function removeEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    if (editingId === id) resetEventForm();
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
        <SectionDivider index={2} />
        <h2 className="section-title">{editingId ? 'Edit event' : 'New event'}</h2>
        {editingId ? (
          <p className="page-lead" style={{ marginBottom: '1rem' }}>
            Editing <strong>{form.title}</strong> ·{' '}
            <button type="button" className="btn btn--ghost" onClick={resetEventForm}>
              Cancel edit
            </button>
          </p>
        ) : null}
        <form ref={eventFormRef} className="form-stack" onSubmit={saveEvent}>
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
            {form.imagePath && !imageFile ? (
              <p className="form-foot">Current image: {form.imagePath}</p>
            ) : null}
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
            <label className="form-field accent-color-field">
              <span>Accent</span>
              <div className="accent-color-field__row">
                <input
                  type="color"
                  className="accent-color-field__input"
                  value={form.accent}
                  onChange={(e) => setForm({ ...form, accent: e.target.value })}
                  aria-label="Event accent color"
                />
                <div
                  className="accent-color-field__preview"
                  style={{ backgroundColor: form.accent }}
                  aria-hidden
                >
                  <span className="accent-color-field__hex">{form.accent.toUpperCase()}</span>
                </div>
              </div>
            </label>
            <label className="form-field">
              <span>Price (₾)</span>
              <input
                type="number"
                min={0}
                value={form.isFreeEntry ? 0 : form.priceGel}
                disabled={form.isFreeEntry}
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
              checked={form.isFreeEntry}
              onChange={(e) =>
                setForm({
                  ...form,
                  isFreeEntry: e.target.checked,
                  priceGel: e.target.checked ? 0 : form.priceGel,
                  freeEntryAccess: e.target.checked ? form.freeEntryAccess : 'INVITED_ONLY',
                })
              }
            />
            Free entry event (online invitation — no paid checkout)
          </label>
          {form.isFreeEntry ? (
            <fieldset className="form-stack" style={{ marginTop: '0.75rem' }}>
              <legend className="table-sub" style={{ marginBottom: '0.5rem' }}>
                Who can claim a free ticket?
              </legend>
              <label className="form-check">
                <input
                  type="radio"
                  name="freeEntryAccess"
                  checked={form.freeEntryAccess === 'ALL_VERIFIED'}
                  onChange={() => setForm({ ...form, freeEntryAccess: 'ALL_VERIFIED' })}
                />
                <span>All verified members — 1 ticket each</span>
              </label>
              <label className="form-check">
                <input
                  type="radio"
                  name="freeEntryAccess"
                  checked={form.freeEntryAccess === 'INVITED_ONLY'}
                  onChange={() => setForm({ ...form, freeEntryAccess: 'INVITED_ONLY' })}
                />
                <span>Invited accounts only — uses account free ticket quota</span>
              </label>
            </fieldset>
          ) : null}
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.artistTicketsEnabled}
              onChange={(e) => setForm({ ...form, artistTicketsEnabled: e.target.checked })}
            />
            Send DJ list 1 free ticket (1 day before event date)
          </label>
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

          <div className="tier-editor" hidden={form.isFreeEntry}>
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
            {uploadingImage ? 'UPLOADING IMAGE…' : editingId ? 'SAVE CHANGES' : 'CREATE EVENT'}
          </button>
        </form>
      </section>

      <section className="admin-events__section">
        <SectionDivider index={3} />
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
        <ResponsiveTable
          columns={[
            { id: 'title', header: 'Title', mobileSummary: true },
            { id: 'date', header: 'Date', mobileSummary: true },
            { id: 'price', header: 'Price' },
            { id: 'status', header: 'Status' },
            { id: 'actions', header: 'Actions' },
          ]}
          rows={events.map((ev) => ({
            id: ev.id,
            cells: {
              title: (
                <>
                  {ev.title}
                  <br />
                  <span className="table-sub">/events/{ev.slug}</span>
                  {ev.imagePath ? (
                    <>
                      <br />
                      <span className="table-sub">image: yes</span>
                    </>
                  ) : null}
                </>
              ),
              date: (
                <>
                  {ev.dayLabel} {ev.dateLabel}
                </>
              ),
              price: ev.isFreeEntry ? 'Free entry' : `${ev.priceGel} ₾`,
              status: (
                <>
                  {ev.published ? 'Live' : 'Hidden'}
                  {ev.isFreeEntry
                    ? ` · Free · ${ev.freeEntryAccess === 'ALL_VERIFIED' ? 'All verified' : 'Invited'}`
                    : ''}
                  {ev.isFeatured ? ' · ★' : ''}
                  {ev.artistTicketsEnabled ? ' · DJ' : ''}
                </>
              ),
              actions: (
                <div className="table-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => startEdit(ev)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => toggleFreeEntry(ev)}>
                    {ev.isFreeEntry ? 'Paid' : 'Free entry'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => togglePublished(ev)}>
                    {ev.published ? 'Hide' : 'Publish'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => removeEvent(ev.id)}>
                    Delete
                  </button>
                </div>
              ),
            },
          }))}
        />
      </section>
    </div>
  );
}
