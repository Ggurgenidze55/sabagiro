'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { formatGel } from '@/lib/format-gel';
import { ticketSuccessUrl } from '@/lib/ticket-success-url';

type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
type FailReason = 'flitt_test' | 'declined' | null;

function ReturnInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') ?? '';
  const hintPaid = searchParams.get('paid') === '1';
  const hintFailed = searchParams.get('failed') === '1';

  const [status, setStatus] = useState<OrderStatus | 'loading'>('loading');
  const [totalGel, setTotalGel] = useState<number | null>(null);
  const [failReason, setFailReason] = useState<FailReason>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('FAILED');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;

      if (!res.ok) {
        attempts += 1;
        if (attempts < 12) {
          setTimeout(poll, 1500);
          return;
        }
        setStatus('FAILED');
        setFailReason('declined');
        return;
      }

      setTotalGel(typeof data.totalGel === 'number' ? data.totalGel : null);
      const s = data.status as OrderStatus;
      if (data.failReason === 'flitt_test' || data.failReason === 'declined') {
        setFailReason(data.failReason);
      }

      if (s === 'PAID') {
        setStatus('PAID');
        router.replace(ticketSuccessUrl({ source: 'purchase', orderId }));
        return;
      }
      if (s === 'FAILED' || s === 'CANCELLED' || s === 'EXPIRED') {
        setStatus(s);
        return;
      }

      if (hintFailed && attempts >= 2) {
        setStatus('FAILED');
        setFailReason((prev) => prev ?? 'declined');
        return;
      }

      attempts += 1;
      if (attempts < 16) {
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
        <p>
          Invalid return link. <Link href="/events">Browse events</Link>
        </p>
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
    const isFlittTest = failReason === 'flitt_test';
    return (
      <main className="payment-page">
        <div className="payment-card payment-card--error">
          <h1>Payment not completed</h1>
          <p>
            {isFlittTest
              ? 'Flitt approved this as a test payment (merchant still in onboarding). The card is not charged and tickets are not issued. Ask Flitt to activate live payments, then try again.'
              : 'No tickets were issued for this order. If money was taken from your card, contact info@sabagiro.ge with the order time and we will check Flitt.'}
          </p>
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
    <Suspense
      fallback={
        <main className="payment-page">
          <p>Loading…</p>
        </main>
      }
    >
      <ReturnInner />
    </Suspense>
  );
}
