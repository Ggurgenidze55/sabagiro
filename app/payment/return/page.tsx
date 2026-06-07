'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { formatGel } from '@/lib/format-gel';
import { ticketSuccessUrl } from '@/lib/ticket-success-url';

type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

function ReturnInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') ?? '';
  const hintPaid = searchParams.get('paid') === '1';
  const hintFailed = searchParams.get('failed') === '1';

  const [status, setStatus] = useState<OrderStatus | 'loading'>('loading');
  const [totalGel, setTotalGel] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('FAILED');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        setStatus('FAILED');
        return;
      }

      setTotalGel(typeof data.totalGel === 'number' ? data.totalGel : null);
      const s = data.status as OrderStatus;

      if (s === 'PAID') {
        setStatus('PAID');
        router.replace(ticketSuccessUrl({ source: 'purchase', orderId }));
        return;
      }
      if (s === 'FAILED' || s === 'CANCELLED' || s === 'EXPIRED') {
        setStatus(s);
        return;
      }

      if (hintFailed) {
        setStatus('FAILED');
        return;
      }

      attempts += 1;
      if (attempts < 12) {
        setTimeout(poll, 1500);
      } else if (hintPaid) {
        setStatus('PENDING');
      } else {
        setStatus('PENDING');
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, hintPaid, hintFailed, router]);

  if (!orderId) {
    return (
      <main className="payment-page">
        <p>Invalid return link. <Link href="/events">Browse events</Link></p>
      </main>
    );
  }

  if (status === 'PAID') {
    return (
      <main className="payment-page">
        <div className="payment-card payment-card--success">
          <h1>Payment successful</h1>
          <p>Redirecting to your tickets…</p>
        </div>
      </main>
    );
  }

  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
    return (
      <main className="payment-page">
        <div className="payment-card payment-card--error">
          <h1>Payment not completed</h1>
          <p>No tickets were issued. You can try again from the event page.</p>
          <Link href="/events" className="btn btn--ghost">
            Browse events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-card">
        <h1>Confirming payment…</h1>
        {totalGel != null ? (
          <p className="payment-card__meta">{formatGel(totalGel)} — please wait.</p>
        ) : (
          <p className="payment-card__meta">Please wait while we confirm with Flitt.</p>
        )}
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className="payment-page"><p>Loading…</p></main>}>
      <ReturnInner />
    </Suspense>
  );
}
