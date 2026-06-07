'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ticketSuccessUrl } from '@/lib/ticket-success-url';

type HolderDraft = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

type EventTicketButtonProps = {
  slug: string;
  isFreeEntry: boolean;
  disabled?: boolean;
  label?: string;
  needsHolderForm?: boolean;
  ticketNumber?: number;
};

function mapApiError(data: { error?: string; code?: string }): string {
  if (data.code === 'NOT_VERIFIED') {
    return 'Verification is required before you can get tickets.';
  }
  if (data.code === 'NO_FREE_TICKETS') {
    return data.error || 'Free ticket limit reached.';
  }
  if (data.code === 'PROFILE_INCOMPLETE') {
    return data.error || 'Complete your profile in Settings first.';
  }
  if (data.code === 'HOLDER_REQUIRED') {
    return data.error || 'Enter guest holder details.';
  }
  if (data.code === 'ALREADY_OWNED' || data.code === 'TICKET_LIMIT') {
    return data.error || 'Ticket limit reached for this event.';
  }
  return data.error || 'Could not complete request';
}

export function EventTicketButton({
  slug,
  isFreeEntry,
  disabled = false,
  label,
  needsHolderForm = false,
  ticketNumber = 2,
}: EventTicketButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holder, setHolder] = useState<HolderDraft>({
    firstName: '',
    lastName: '',
    personalId: '',
    email: '',
    phone: '',
  });

  const buttonLabel =
    label ??
    (isFreeEntry
      ? needsHolderForm
        ? 'Generate guest ticket'
        : 'Get free ticket'
      : needsHolderForm
        ? 'Buy guest ticket'
        : 'Buy ticket');

  function updateHolderField(field: keyof HolderDraft, value: string) {
    setHolder((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(payload: Record<string, unknown>) {
    if (isFreeEntry) {
      const res = await fetch('/api/account/free-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/login?next=/events/${encodeURIComponent(slug)}`);
        return;
      }
      if (!res.ok) {
        setError(mapApiError(data));
        return;
      }
      router.push(ticketSuccessUrl({ source: 'free', slug }));
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      router.push(`/login?next=/events/${encodeURIComponent(slug)}`);
      return;
    }
    if (!res.ok) {
      setError(mapApiError(data));
      return;
    }
    if (typeof data.redirectUrl === 'string' && data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }
    if (typeof data.orderId === 'string' && data.orderId) {
      router.push(ticketSuccessUrl({ source: 'purchase', orderId: data.orderId, slug }));
      return;
    }
    router.push(ticketSuccessUrl({ source: 'purchase', slug }));
  }

  async function handleInstantClick() {
    if (disabled || loading) return;
    setError('');
    setLoading(true);
    try {
      await submit(
        isFreeEntry
          ? { productSlug: slug }
          : { items: [{ slug, qty: 1, holders: [] }] },
      );
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled || loading) return;
    setError('');
    setLoading(true);
    const holderPayload = {
      firstName: holder.firstName.trim(),
      lastName: holder.lastName.trim(),
      personalId: holder.personalId.trim(),
      email: holder.email.trim(),
      phone: holder.phone.trim(),
    };
    try {
      if (isFreeEntry) {
        await submit({ productSlug: slug, ...holderPayload });
      } else {
        await submit({
          items: [{ slug, qty: 1, holders: [holderPayload] }],
        });
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  if (needsHolderForm) {
    return (
      <div className="event-ticket-action">
        <form className="form-stack event-ticket-action__form" onSubmit={handleFormSubmit}>
          <p className="table-sub" style={{ marginBottom: '0.25rem' }}>
            Ticket #{ticketNumber} — guest holder details (required)
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
          <button type="submit" className="btn" disabled={disabled || loading}>
            {loading ? '…' : buttonLabel}
          </button>
        </form>
        {error ? <p className="form-error event-ticket-action__error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="event-ticket-action">
      <button
        type="button"
        className="btn"
        onClick={handleInstantClick}
        disabled={disabled || loading}
        style={{ opacity: disabled ? 0.45 : 1 }}
      >
        {loading ? '…' : buttonLabel}
      </button>
      {error ? <p className="form-error event-ticket-action__error">{error}</p> : null}
    </div>
  );
}
