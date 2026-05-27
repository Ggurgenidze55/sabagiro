'use client';

import { useEffect, useState } from 'react';
import { scanUrl } from '@/lib/qr';

type EventOption = { slug: string; title: string };

export function AdminGenerateForm() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ qrToken: string; productName: string } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events) {
          setEvents(d.events.map((e: { slug: string; title: string }) => ({ slug: e.slug, title: e.title })));
        }
      })
      .catch(() => setError('Could not load events'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);
    setQrImage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/tickets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setResult({ qrToken: data.ticket.qrToken, productName: data.ticket.productName });
    const QRCode = (await import('qrcode')).default;
    setQrImage(await QRCode.toDataURL(scanUrl(data.ticket.qrToken), { width: 280, margin: 1 }));
  }

  return (
    <div>
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="form-field">
          <span>Event ticket</span>
          <select name="productSlug" required defaultValue={events[0]?.slug}>
            {events.length === 0 ? (
              <option value="">No events — create one in Events</option>
            ) : (
              events.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="form-field">
          <span>First name</span>
          <input name="firstName" required />
        </label>
        <label className="form-field">
          <span>Last name</span>
          <input name="lastName" required />
        </label>
        <label className="form-field">
          <span>Personal ID</span>
          <input name="personalId" required pattern="\d{11}" />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        <label className="form-field">
          <span>Phone</span>
          <input name="phone" required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn" disabled={events.length === 0 || !events[0]?.slug}>
          GENERATE TICKET + QR
        </button>
      </form>
      {result && qrImage ? (
        <div className="admin-qr-result">
          <p className="form-ok">
            {result.productName} — ticket created. Email sent if Resend is configured.
          </p>
          <img src={qrImage} alt="Generated QR" className="ticket-card__qr" width={280} height={280} />
          <a href={scanUrl(result.qrToken)} className="ticket-card__link" target="_blank" rel="noopener noreferrer">
            {scanUrl(result.qrToken)}
          </a>
        </div>
      ) : null}
    </div>
  );
}
