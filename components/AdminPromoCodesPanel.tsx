'use client';

import { ResponsiveTable } from '@/components/ResponsiveTable';
import { IntInput } from '@/components/IntInput';
import { useCallback, useEffect, useState } from 'react';

type EventOption = { slug: string; title: string; published: boolean };

type PromoRow = {
  id: string;
  code: string;
  percentOff: number;
  eventSlug: string;
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
};

const defaultForm = {
  code: '',
  percentOff: 10,
  eventSlug: '',
  active: true,
  maxUses: '',
  expiresAt: '',
};

export function AdminPromoCodesPanel() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [evRes, promoRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/promo-codes'),
      ]);
      const evData = await evRes.json().catch(() => ({}));
      const promoData = await promoRes.json().catch(() => ({}));

      if (promoRes.ok) {
        setRows(promoData.promoCodes ?? []);
      } else {
        setRows([]);
        setError(promoData.error || 'Could not load promo codes');
      }

      if (evRes.ok) {
        setEvents(
          (evData.events ?? []).map((e: { slug: string; title: string; published: boolean }) => ({
            slug: e.slug,
            title: e.title,
            published: e.published,
          })),
        );
      } else if (promoRes.ok) {
        setError((prev) => prev || evData.error || 'Could not load events for dropdown');
      }
    } catch {
      setError('Network error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createPromo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!form.eventSlug) {
      setError('Choose an event');
      return;
    }
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          percentOff: form.percentOff,
          eventSlug: form.eventSlug,
          active: form.active,
          maxUses: form.maxUses.trim() ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt.trim() ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create promo');
        return;
      }
      setMsg('Promo code created');
      setForm(defaultForm);
      load();
    } catch {
      setError('Network error');
    }
  }

  async function toggleActive(row: PromoRow) {
    setError('');
    const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Update failed');
      return;
    }
    load();
  }

  async function remove(row: PromoRow) {
    if (!confirm(`Delete promo ${row.code}?`)) return;
    const res = await fetch(`/api/admin/promo-codes/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Delete failed');
      return;
    }
    load();
  }

  function eventTitle(slug: string) {
    return events.find((e) => e.slug === slug)?.title ?? slug;
  }

  return (
    <div className="admin-promo">
      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}

      <section className="admin-promo__section">
        <h2 className="section-title">New promo code</h2>
        <form className="form-stack admin-promo__create-form" onSubmit={createPromo}>
          <label className="form-field admin-promo__field-code">
            <span>Code</span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              placeholder="SUMMER20"
            />
          </label>
          <div className="form-row admin-promo__create-row">
            <label className="form-field admin-promo__field-discount">
              <span>Discount %</span>
              <IntInput
                value={form.percentOff}
                onChange={(percentOff) => setForm({ ...form, percentOff })}
                min={1}
                max={99}
              />
            </label>
            <label className="form-field admin-promo__field-event">
              <span>Event</span>
              <select
                value={form.eventSlug}
                onChange={(e) => setForm({ ...form, eventSlug: e.target.value })}
                required
              >
                <option value="">Select event…</option>
                {events.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title} {!ev.published ? '(hidden)' : ''} · /events/{ev.slug}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Max uses (optional)</span>
              <input
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                inputMode="numeric"
                placeholder="Unlimited"
              />
            </label>
            <label className="form-field">
              <span>Expires (optional)</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </label>
          </div>
          <label className="form-field form-field--checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>Active</span>
          </label>
          <button type="submit" className="btn">
            Create promo
          </button>
        </form>
      </section>

      <section className="admin-promo__section">
        <h2 className="section-title">All promo codes ({rows.length})</h2>
        <p className="table-sub admin-promo__list-lead">
          Full list for every event — per-event sales breakdown is on each event&apos;s Stats page.
        </p>
        <ResponsiveTable
          empty={<p className="cart-empty">No promo codes yet.</p>}
          columns={[
            { id: 'code', header: 'Code', mobileSummary: true },
            { id: 'event', header: 'Event', mobileSummary: true },
            { id: 'discount', header: 'Discount' },
            { id: 'uses', header: 'Uses' },
            { id: 'status', header: 'Status' },
            { id: 'actions', header: 'Actions' },
          ]}
          rows={rows.map((row) => ({
            id: row.id,
            cells: {
              code: row.code,
              event: (
                <>
                  {eventTitle(row.eventSlug)}
                  <br />
                  <span className="table-sub">/events/{row.eventSlug}</span>
                </>
              ),
              discount: `${row.percentOff}%`,
              uses: row.maxUses != null ? `${row.usedCount} / ${row.maxUses}` : `${row.usedCount} · ∞`,
              status: (
                <>
                  {row.active ? 'Active' : 'Off'}
                  {row.expiresAt ? (
                    <>
                      <br />
                      <span className="table-sub">until {new Date(row.expiresAt).toLocaleString()}</span>
                    </>
                  ) : null}
                </>
              ),
              actions: (
                <div className="table-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => toggleActive(row)}>
                    {row.active ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => remove(row)}>
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
