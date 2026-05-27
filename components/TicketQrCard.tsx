'use client';

import { useEffect, useState } from 'react';

type TicketQrCardProps = {
  ticketId: string;
  productName: string;
  status: string;
  holderName: string;
  personalId: string;
};

export function TicketQrCard({ ticketId, productName, status, holderName, personalId }: TicketQrCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}/qr`)
      .then((r) => r.json())
      .then((d) => {
        if (d.dataUrl) setDataUrl(d.dataUrl);
        if (d.qrToken) setQrToken(d.qrToken);
      })
      .catch(() => {});
  }, [ticketId]);

  return (
    <article className="ticket-card">
      <div className="ticket-card__head">
        <h3>{productName}</h3>
        <span className={`ticket-status ticket-status--${status.toLowerCase()}`}>{status}</span>
      </div>
      <p className="ticket-card__meta">
        {holderName} · {personalId}
      </p>
      {dataUrl ? (
        <img src={dataUrl} alt="Ticket QR code" className="ticket-card__qr" width={200} height={200} />
      ) : (
        <p className="ticket-card__loading">Loading QR…</p>
      )}
      {qrToken ? (
        <a href={`/scan/${qrToken}`} className="ticket-card__link" target="_blank" rel="noopener noreferrer">
          Scan link →
        </a>
      ) : null}
    </article>
  );
}
