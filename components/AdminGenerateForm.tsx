'use client';

import { useEffect, useState } from 'react';
import { scanUrl } from '@/lib/qr';

type EventOption = { slug: string; title: string };

export function AdminGenerateForm() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [productSlug, setProductSlug] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ qrToken: string; productName: string; emailSent: boolean } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events) {
          const list = d.events.map((e: { slug: string; title: string }) => ({
            slug: e.slug,
            title: e.title,
          }));
          setEvents(list);
          setProductSlug((prev) => prev || list[0]?.slug || '');
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
    const body = Object.fromEntries(fd.entries());
    body.productSlug = productSlug;

    const res = await fetch('/api/admin/tickets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    const emailSent = Boolean(data.email?.sent);
    setResult({
      qrToken: data.ticket.qrToken,
      productName: data.ticket.productName,
      emailSent,
    });
    if (!emailSent) {
      setError(
        data.email?.skipped
          ? 'Ticket created — email skipped (RESEND_API_KEY not set)'
          : data.email?.error || 'Ticket created but email failed to send',
      );
    }
    const QRCode = (await import('qrcode')).default;
    setQrImage(await QRCode.toDataURL(scanUrl(data.ticket.qrToken), { width: 280, margin: 1 }));
  }

  return (
    <div>
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="form-field">
          <span>Event ticket</span>
          <select
            name="productSlug"
            required
            value={productSlug}
            onChange={(e) => setProductSlug(e.target.value)}
          >
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
        <button type="submit" className="btn" disabled={events.length === 0 || !productSlug}>
          GENERATE TICKET + QR
        </button>
      </form>
      {result && qrImage ? (
        <div className="admin-qr-result">
          <p className="form-ok">
            {result.productName} — ticket created.
            {result.emailSent ? ' Email sent.' : ' Check email settings above.'}
          </p>
          <img src={qrImage} alt="Generated QR" className="ticket-card__qr" width={280} height={280} />
          <a href={scanUrl(result.qrToken)} className="ticket-card__link">
            {scanUrl(result.qrToken)}
          </a>
        </div>
      ) : null}
    </div>
  );
}
