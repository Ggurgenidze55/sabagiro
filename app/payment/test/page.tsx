'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
function TestPaymentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') ?? '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(action: 'approve' | 'decline') {
    if (!orderId) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/payment/test-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Payment failed');
        setBusy(false);
        return;
      }
      router.replace(
        action === 'approve'
          ? `/payment/return?orderId=${encodeURIComponent(orderId)}&paid=1`
          : `/payment/return?orderId=${encodeURIComponent(orderId)}&failed=1`,
      );
    } catch {
      setError('Network error');
      setBusy(false);
    }
  }

  if (!orderId) {
    return (
      <main className="payment-page">
        <p>Missing order. Return to <Link href="/cart">cart</Link>.</p>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-card">
        <p className="payment-card__eyebrow">Test payment</p>
        <h1>Simulate bank checkout</h1>
        <p className="payment-card__meta">
          Order <code>{orderId.slice(0, 10)}…</code> — no real charge. Use this until TBC credentials are configured.
        </p>
        {error ? <p className="payment-card__error">{error}</p> : null}
        <div className="payment-card__actions">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => act('approve')}
          >
            Pay now (test)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => act('decline')}
          >
            Cancel
          </button>
        </div>
        <p className="payment-card__hint">
          Production: you will be redirected to TBC card page instead.
        </p>
      </div>
    </main>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={<main className="payment-page"><p>Loading…</p></main>}>
      <TestPaymentInner />
    </Suspense>
  );
}
