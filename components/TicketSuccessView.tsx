'use client';

import { useEffect, useState } from 'react';

const REDIRECT_SECONDS = 5;

type TicketSuccessViewProps = {
  source: 'free' | 'purchase';
  eventName?: string;
};

function goToAccount() {
  window.location.assign('/account');
}

export function TicketSuccessView({ source, eventName }: TicketSuccessViewProps) {
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) return;
    goToAccount();
  }, [secondsLeft]);

  const title = source === 'free' ? 'Free ticket ready' : 'Ticket purchased';
  const lead = eventName
    ? `Your ticket for ${eventName} is being saved to your account.`
    : 'Your ticket is being saved to your account.';

  return (
    <div className="ticket-success">
      <div className="ticket-success__overlay" aria-hidden />
      <div
        className="payment-card payment-card--success ticket-success__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-success-title"
      >
        <p className="payment-card__eyebrow">Success</p>
        <h1 id="ticket-success-title" className="page-title ticket-success__title">
          {title}
        </h1>
        <p className="page-lead ticket-success__lead">{lead}</p>
        <p className="payment-card__meta">
          QR code and details will appear on My Tickets. A confirmation email was sent when
          delivery succeeded.
        </p>

        <div className="ticket-success__countdown" aria-live="polite">
          <span className="ticket-success__countdown-num">{secondsLeft}</span>
          <span className="ticket-success__countdown-label">
            {secondsLeft > 0 ? 'Opening My Tickets in…' : 'Opening My Tickets…'}
          </span>
        </div>

        <div className="payment-card__actions">
          <button type="button" className="btn" onClick={goToAccount}>
            View my tickets now
          </button>
          <a href="/events" className="btn btn--ghost">
            Browse events
          </a>
        </div>
      </div>
    </div>
  );
}
