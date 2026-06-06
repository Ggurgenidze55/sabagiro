'use client';

import { useMemo, useState } from 'react';
import { ResponsiveTable } from '@/components/ResponsiveTable';

export type AdminArtistRow = {
  id: string;
  stageName: string;
  displayName: string;
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
  instagramUrl: string;
  active: boolean;
  weeklyTickets: boolean;
  dispatchCount: number;
};

const emptyForm = {
  stageName: '',
  firstName: '',
  lastName: '',
  personalId: '',
  email: '',
  phone: '',
  instagramUrl: '',
};

export function AdminArtistsPanel({ artists: initial }: { artists: AdminArtistRow[] }) {
  const [artists, setArtists] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dispatchBusy, setDispatchBusy] = useState(false);

  const activeCount = useMemo(
    () => artists.filter((a) => a.active && a.weeklyTickets).length,
    [artists],
  );

  async function reload() {
    const res = await fetch('/api/admin/artists');
    const data = await res.json();
    if (res.ok && data.artists) setArtists(data.artists);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add artist');
        return;
      }
      setForm(emptyForm);
      setMsg('Artist added.');
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function patchArtist(id: string, patch: Partial<AdminArtistRow>) {
    setError('');
    setMsg('');
    const res = await fetch(`/api/admin/artists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Update failed');
      return false;
    }
    await reload();
    return true;
  }

  async function removeArtist(id: string) {
    if (!window.confirm('Remove this artist from the roster?')) return;
    setError('');
    setMsg('');
    const res = await fetch(`/api/admin/artists/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Delete failed');
      return;
    }
    setMsg('Artist removed.');
    await reload();
  }

  async function runDispatch() {
    if (
      !window.confirm(
        'Send this week\'s tickets to all active artists for every upcoming event? Already-sent pairs are skipped.',
      )
    ) {
      return;
    }
    setDispatchBusy(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/artists/dispatch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Dispatch failed');
        return;
      }
      const r = data.result;
      setMsg(
        `Dispatch done — ${r.created} ticket(s) created, ${r.skipped} skipped, ${r.emailsSent} email(s) sent.`,
      );
      if (r.errors?.length) {
        setError(r.errors.slice(0, 3).join(' · '));
      }
      await reload();
    } finally {
      setDispatchBusy(false);
    }
  }

  return (
    <div className="admin-artists">
      <div className="admin-artists__intro">
        <p className="page-lead" style={{ marginBottom: '0.75rem' }}>
          DJ roster — comp tickets for every published upcoming event, emailed each Thursday at 20:00
          (Tbilisi).
        </p>
        <p className="form-foot" style={{ marginBottom: '1rem' }}>
          Active roster: {activeCount} · Total: {artists.length}
        </p>
        <div className="cart-actions" style={{ marginBottom: '1.5rem' }}>
          <button type="button" className="btn btn--ghost" onClick={runDispatch} disabled={dispatchBusy}>
            {dispatchBusy ? 'Sending…' : 'SEND THIS WEEK NOW'}
          </button>
        </div>
      </div>

      <form className="form-stack admin-artists__form" onSubmit={onAdd}>
        <h2 className="admin-section-title">Add DJ / artist</h2>
        <div className="admin-artists__grid">
          <label className="form-field">
            <span>Stage / DJ name</span>
            <input
              value={form.stageName}
              onChange={(e) => setForm({ ...form, stageName: e.target.value })}
              placeholder="e.g. Nika J"
            />
          </label>
          <label className="form-field">
            <span>First name (ticket)</span>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </label>
          <label className="form-field">
            <span>Last name (ticket)</span>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </label>
          <label className="form-field">
            <span>Personal ID</span>
            <input
              value={form.personalId}
              onChange={(e) => setForm({ ...form, personalId: e.target.value })}
              required
              pattern="\d{11}"
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </label>
          <label className="form-field">
            <span>Instagram (optional)</span>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/…"
            />
          </label>
        </div>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Adding…' : 'ADD ARTIST'}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}

      <h2 className="admin-section-title" style={{ marginTop: '2rem' }}>
        Roster
      </h2>
      {artists.length === 0 ? (
        <p className="page-lead">No artists yet — add your first DJ above.</p>
      ) : (
        <ResponsiveTable
          columns={[
            { id: 'name', header: 'Artist', mobileSummary: true },
            { id: 'email', header: 'Email', mobileSummary: true },
            { id: 'phone', header: 'Phone' },
            { id: 'flags', header: 'Weekly' },
            { id: 'sent', header: 'Sent' },
            { id: 'actions', header: '' },
          ]}
          rows={artists.map((a) => ({
            id: a.id,
            cells: {
              name: (
                <span>
                  <strong>{a.displayName}</strong>
                  {a.instagramUrl ? (
                    <>
                      <br />
                      <a href={a.instagramUrl} target="_blank" rel="noreferrer" className="ticket-card__link">
                        Instagram
                      </a>
                    </>
                  ) : null}
                </span>
              ),
              email: a.email,
              phone: a.phone,
              flags: (
                <span className="admin-artists__flags">
                  <label className="admin-artists__toggle">
                    <input
                      type="checkbox"
                      checked={a.active}
                      onChange={async (e) => {
                        await patchArtist(a.id, { active: e.target.checked });
                      }}
                    />
                    Active
                  </label>
                  <label className="admin-artists__toggle">
                    <input
                      type="checkbox"
                      checked={a.weeklyTickets}
                      onChange={async (e) => {
                        await patchArtist(a.id, { weeklyTickets: e.target.checked });
                      }}
                    />
                    Weekly
                  </label>
                </span>
              ),
              sent: String(a.dispatchCount),
              actions: (
                <button type="button" className="btn btn--ghost" onClick={() => removeArtist(a.id)}>
                  Remove
                </button>
              ),
            },
          }))}
        />
      )}
    </div>
  );
}
