'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const REDIRECT_SECONDS = 5;

type TicketSuccessViewProps = {
  source: 'free' | 'purchase';
  eventName?: string;
};

export function TicketSuccessView({ source, eventName }: TicketSuccessViewProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) return;
    router.replace('/account');
  }, [router, secondsLeft]);

  const title = source === 'free' ? 'Free ticket ready' : 'Ticket purchased';
  const lead = eventName
    ? `Your ticket for ${eventName} is in your account. QR code and details are on My Tickets.`
    : 'Your ticket is in your account. QR code and details are on My Tickets.';

  return (
    <div className="ticket-success">
      <div className="payment-card payment-card--success ticket-success__card">
        <p className="payment-card__eyebrow">Success</p>
        <h1 className="page-title ticket-success__title">{title}</h1>
        <p className="page-lead ticket-success__lead">{lead}</p>
        <p className="payment-card__meta">
          A confirmation email was sent when delivery succeeded.
        </p>
        <div className="payment-card__actions">
          <Link href="/account" className="btn">
            View my tickets
          </Link>
          <Link href="/events" className="btn btn--ghost">
            Browse events
          </Link>
        </div>
        <p className="payment-card__hint">
          Redirecting to My Tickets in {secondsLeft}s…
        </p>
      </div>
    </div>
  );
}
