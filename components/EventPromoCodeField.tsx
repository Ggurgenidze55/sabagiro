'use client';

import { useState } from 'react';

type EventPromoCodeFieldProps = {
  eventSlug: string;
  onApplied: (code: string | null, percentOff: number | null) => void;
};

export function EventPromoCodeField({ eventSlug, onApplied }: EventPromoCodeFieldProps) {
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  async function apply() {
    const code = draft.trim();
    if (!code) {
      setAppliedCode(null);
      onApplied(null, null);
      setStatus('idle');
      setMessage('');
      return;
    }

    setStatus('checking');
    setMessage('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, slug: eventSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus('err');
        setMessage(data.error || 'Invalid promo code');
        setAppliedCode(null);
        onApplied(null, null);
        return;
      }
      setStatus('ok');
      setAppliedCode(data.code);
      setMessage(`${data.percentOff}% off this event`);
      onApplied(data.code, data.percentOff);
    } catch {
      setStatus('err');
      setMessage('Network error');
      onApplied(null, null);
    }
  }

  function clear() {
    setDraft('');
    setAppliedCode(null);
    setStatus('idle');
    setMessage('');
    onApplied(null, null);
  }

  return (
    <div className="event-promo-field">
      <label className="form-field event-promo-field__label">
        <span>Promo code</span>
        <div className="event-promo-field__row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter code"
            autoComplete="off"
            disabled={Boolean(appliedCode)}
          />
          {appliedCode ? (
            <button type="button" className="btn btn--ghost" onClick={clear}>
              Remove
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={apply} disabled={status === 'checking'}>
              {status === 'checking' ? '…' : 'Apply'}
            </button>
          )}
        </div>
      </label>
      {message ? (
        <p className={`event-promo-field__hint${status === 'err' ? ' event-promo-field__hint--err' : ''}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
