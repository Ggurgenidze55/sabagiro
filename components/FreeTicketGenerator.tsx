'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INVITATION_GENERATOR_TITLE } from '@/lib/invitation';
import { ticketSuccessUrl } from '@/lib/ticket-success-url';

type EventOption = { slug: string; title: string };

type GuestDraft = {
  firstName: string;
  lastName: string;
  email: string;
};

type FreeTicketGeneratorProps = {
  quota: number;
  usedByEvent: Record<string, number>;
  profileComplete: boolean;
};

const emptyGuest = (): GuestDraft => ({
  firstName: '',
  lastName: '',
  email: '',
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
  const [guest, setGuest] = useState<GuestDraft>(emptyGuest);

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
  const needsGuestForm = usedForSelected > 0;

  const remainingForSelected = useMemo(() => {
    if (!selectedSlug) return quota;
    return Math.max(0, quota - usedForSelected);
  }, [quota, selectedSlug, usedForSelected]);

  function updateGuestField(field: keyof GuestDraft, value: string) {
    setGuest((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlug) return;
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, string> = { productSlug: selectedSlug };
      if (needsGuestForm) {
        payload.firstName = guest.firstName.trim();
        payload.lastName = guest.lastName.trim();
        payload.email = guest.email.trim();
      }

      const res = await fetch('/api/account/free-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not generate invitation');
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
    (needsGuestForm
      ? guest.firstName.trim().length >= 2 &&
        guest.lastName.trim().length >= 2 &&
        guest.email.trim().includes('@')
      : true);

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="section-title section-title--flush">{INVITATION_GENERATOR_TITLE}</h2>
      <p className="page-lead" style={{ marginBottom: '0.5rem' }}>
        All events · {quota} invitation(s) per event. Your first invitation uses your account
        details; additional invitations need guest name and email only.
      </p>
      {!profileComplete && !needsGuestForm ? (
        <p className="notice-banner notice-banner--inline" style={{ marginBottom: '1rem' }}>
          Complete your profile in Settings before generating your first invitation.{' '}
          <Link href="/account/settings" className="btn btn--ghost">
            Settings
          </Link>
        </p>
      ) : null}
      <p className="page-lead" style={{ marginBottom: '1rem', color: 'var(--acid, #f7e892)' }}>
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
              setGuest(emptyGuest());
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
        {needsGuestForm ? (
          <div className="notice-banner notice-banner--inline" style={{ maxWidth: '100%' }}>
            <p className="table-sub" style={{ marginBottom: '0.6rem' }}>
              Invitation #{usedForSelected + 1} — guest details (required)
            </p>
            <div className="form-row">
              <label className="form-field">
                <span>First name</span>
                <input
                  value={guest.firstName}
                  onChange={(e) => updateGuestField('firstName', e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Last name</span>
                <input
                  value={guest.lastName}
                  onChange={(e) => updateGuestField('lastName', e.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={guest.email}
                  onChange={(e) => updateGuestField('email', e.target.value)}
                  required
                />
              </label>
            </div>
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {remainingForSelected <= 0 && selectedSlug ? (
          <p className="form-error">Invitation limit reached for this event.</p>
        ) : null}
        <button
          type="submit"
          className="btn"
          disabled={loading || events.length === 0 || remainingForSelected <= 0 || !canSubmit}
        >
          {loading ? '…' : needsGuestForm ? 'Send guest invitation' : 'Generate invitation'}
        </button>
      </form>
    </section>
  );
}
