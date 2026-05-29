'use client';

import { useEffect, useState } from 'react';

type TicketQrCardProps = {
  ticketId: string;
  productName: string;
  status: string;
  holderName: string;
  personalId: string;
  issuanceLine?: string;
};

export function TicketQrCard({
  ticketId,
  productName,
  status,
  holderName,
  personalId,
  issuanceLine,
}: TicketQrCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`/api/tickets/${ticketId}/qr`).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load QR');
        return d;
      }),
      fetch('/api/wallet/status')
        .then((r) => r.json())
        .then((d) => Boolean(d.appleWallet))
        .catch(() => false),
    ])
      .then(([qr, wallet]) => {
        if (cancelled) return;
        if (qr.dataUrl) setDataUrl(qr.dataUrl);
        if (qr.qrToken) setQrToken(qr.qrToken);
        setWalletEnabled(wallet);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load QR');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const walletHref = `/api/tickets/${ticketId}/wallet`;
  const showWallet = walletEnabled && status !== 'CANCELLED';

  return (
    <article className="ticket-card">
      <div className="ticket-card__head">
        <h3>{productName}</h3>
        <span className={`ticket-status ticket-status--${status.toLowerCase()}`}>{status}</span>
      </div>
      <p className="ticket-card__meta">
        Entry: {holderName} · {personalId}
      </p>
      {issuanceLine ? <p className="ticket-card__meta">{issuanceLine}</p> : null}
      {dataUrl ? (
        <img src={dataUrl} alt="Ticket QR code" className="ticket-card__qr" width={200} height={200} />
      ) : loading ? (
        <p className="ticket-card__loading">Loading QR…</p>
      ) : (
        <p className="form-error ticket-card__loading">{error || 'QR unavailable'}</p>
      )}
      {showWallet ? (
        <a href={walletHref} className="wallet-badge" download>
          Add to Apple Wallet
        </a>
      ) : null}
      {qrToken ? (
        <a href={`/scan/${qrToken}`} className="ticket-card__link">
          Scan link →
        </a>
      ) : null}
    </article>
  );
}
