'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ticketSuccessUrl } from '@/lib/ticket-success-url';

type EventOption = { slug: string; title: string };

type HolderDraft = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

type FreeTicketGeneratorProps = {
  quota: number;
  usedByEvent: Record<string, number>;
  profileComplete: boolean;
};

const emptyHolder = (): HolderDraft => ({
  firstName: '',
  lastName: '',
  personalId: '',
  email: '',
  phone: '',
});

export function FreeTicketGenerator({
  quota,
  usedByEvent,
  profileComplete,
}: FreeTicketGeneratorProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localUsedByEvent, setLocalUsedByEvent] = useState(usedByEvent);
  const [holder, setHolder] = useState<HolderDraft>(emptyHolder);

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
      .catch(() => setError('Could not load events'));
  }, []);

  const usedForSelected = selectedSlug ? (localUsedByEvent[selectedSlug] ?? 0) : 0;
  const needsHolderForm = usedForSelected > 0;

  const remainingForSelected = useMemo(() => {
    if (!selectedSlug) return quota;
    return Math.max(0, quota - usedForSelected);
  }, [quota, selectedSlug, usedForSelected]);

  function updateHolderField(field: keyof HolderDraft, value: string) {
    setHolder((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlug) return;
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, string> = { productSlug: selectedSlug };
      if (needsHolderForm) {
        payload.firstName = holder.firstName.trim();
        payload.lastName = holder.lastName.trim();
        payload.personalId = holder.personalId.trim();
        payload.email = holder.email.trim();
        payload.phone = holder.phone.trim();
      }

      const res = await fetch('/api/account/free-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not generate ticket');
        return;
      }
      router.push(ticketSuccessUrl({ source: 'free', slug: selectedSlug }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message.includes('fetch') ? 'Network error — check connection' : message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    profileComplete &&
    (needsHolderForm
      ? holder.firstName.trim().length >= 2 &&
        holder.lastName.trim().length >= 2 &&
        /^\d{11}$/.test(holder.personalId.trim()) &&
        holder.email.trim().includes('@') &&
        holder.phone.trim().length >= 9
      : true);

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="section-title section-title--flush">Free Ticket Generator</h2>
      <p className="page-lead" style={{ marginBottom: '0.5rem' }}>
        All events · {quota} ticket(s) per event. Your first ticket uses your account
        details; additional tickets need guest holder details.
      </p>
      {!profileComplete && !needsHolderForm ? (
        <p className="notice-banner notice-banner--inline" style={{ marginBottom: '1rem' }}>
          Complete your profile in Settings before generating your first ticket.{' '}
          <Link href="/account/settings" className="btn btn--ghost">
            Settings
          </Link>
        </p>
      ) : null}
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
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setHolder(emptyHolder());
              setError('');
            }}
          >
            {events.length === 0 ? (
              <option value="">No published events</option>
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
        {needsHolderForm ? (
          <div className="notice-banner notice-banner--inline" style={{ maxWidth: '100%' }}>
            <p className="table-sub" style={{ marginBottom: '0.6rem' }}>
              Ticket #{usedForSelected + 1} — guest holder details (required)
            </p>
            <div className="form-row">
              <label className="form-field">
                <span>First name</span>
                <input
                  value={holder.firstName}
                  onChange={(e) => updateHolderField('firstName', e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Last name</span>
                <input
                  value={holder.lastName}
                  onChange={(e) => updateHolderField('lastName', e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Personal ID</span>
                <input
                  value={holder.personalId}
                  onChange={(e) => updateHolderField('personalId', e.target.value)}
                  pattern="\d{11}"
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={holder.email}
                  onChange={(e) => updateHolderField('email', e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input
                  value={holder.phone}
                  onChange={(e) => updateHolderField('phone', e.target.value)}
                  required
                />
              </label>
            </div>
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {remainingForSelected <= 0 && selectedSlug ? (
          <p className="form-error">Free ticket limit reached for this event.</p>
        ) : null}
        <button
          type="submit"
          className="btn"
          disabled={loading || events.length === 0 || remainingForSelected <= 0 || !canSubmit}
        >
          {loading ? '…' : needsHolderForm ? 'Generate guest ticket' : 'Generate free ticket'}
        </button>
      </form>
    </section>
  );
}
