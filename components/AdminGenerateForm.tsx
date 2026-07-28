'use client';

import { useEffect, useState } from 'react';
import { scanUrl } from '@/lib/qr';
import { ADMIN_GENERATE_QUANTITY_MAX, ADMIN_GENERATE_QUANTITY_MIN } from '@/lib/invitation';

type EventOption = { slug: string; title: string };

export function AdminGenerateForm() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [productSlug, setProductSlug] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    quantity: number;
    emailsSent: number;
    qrToken?: string;
    productName?: string;
  } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const singleTicket = quantity === 1;

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
    const body: Record<string, string> = {
      productSlug,
      email: String(fd.get('email') ?? ''),
      firstName: String(fd.get('firstName') ?? ''),
      lastName: String(fd.get('lastName') ?? ''),
      quantity: String(quantity),
    };

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

    const emailsSent = Number(data.emailsSent ?? (data.email?.sent ? 1 : 0));
    const sentQty = Number(data.quantity ?? 1);

    setResult({
      quantity: sentQty,
      emailsSent,
      qrToken: singleTicket ? data.ticket?.qrToken : undefined,
      productName: data.ticket?.productName,
    });

    if (emailsSent < sentQty) {
      setError(
        data.email?.skipped
          ? `${sentQty} invitation(s) created — email skipped (RESEND_API_KEY not set)`
          : data.email?.error ||
              `${emailsSent} of ${sentQty} email(s) sent — check email settings`,
      );
    }

    if (singleTicket && data.ticket?.qrToken) {
      const QRCode = (await import('qrcode')).default;
      setQrImage(await QRCode.toDataURL(scanUrl(data.ticket.qrToken), { width: 280, margin: 1 }));
    }
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
          <span>Number of invitations</span>
          <select
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {Array.from(
              { length: ADMIN_GENERATE_QUANTITY_MAX - ADMIN_GENERATE_QUANTITY_MIN + 1 },
              (_, i) => ADMIN_GENERATE_QUANTITY_MIN + i,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>First name</span>
          <input name="firstName" required minLength={2} />
        </label>
        <label className="form-field">
          <span>Last name</span>
          <input name="lastName" required minLength={2} />
        </label>
        {!singleTicket ? (
          <p className="form-foot form-foot--note">
            {quantity} emails — each ticket named Last name Guest 1, Guest 2, … Guest {quantity}.
          </p>
        ) : null}
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn" disabled={events.length === 0 || !productSlug}>
          {singleTicket ? 'SEND INVITATION + QR' : `SEND ${quantity} INVITATIONS BY EMAIL`}
        </button>
      </form>
      {result ? (
        <div className="admin-qr-result">
          <p className="form-ok">
            {result.productName ? `${result.productName} — ` : ''}
            {result.quantity === 1
              ? 'Invitation created.'
              : `${result.emailsSent} of ${result.quantity} invitation email(s) sent.`}
            {result.quantity === 1 && result.emailsSent === 1 ? ' Email sent.' : null}
          </p>
          {qrImage ? (
            <>
              <img src={qrImage} alt="Generated QR" className="ticket-card__qr" width={280} height={280} />
              {result.qrToken ? (
                <a href={scanUrl(result.qrToken)} className="ticket-card__link">
                  {scanUrl(result.qrToken)}
                </a>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
