'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EventOption = { slug: string; title: string };

type FreeTicketGeneratorProps = {
  remaining: number;
  quota: number;
  used: number;
};

export function FreeTicketGenerator({ remaining, quota, used }: FreeTicketGeneratorProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.events) {
          setEvents(
            d.events.map((e: { slug: string; title: string }) => ({ slug: e.slug, title: e.title })),
          );
        }
      })
      .catch(() => setError('ღონისძიებების ჩატვირთვა ვერ მოხერხდა'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/account/free-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'ვერ გენერირდა');
        return;
      }
      setMsg('უფასო ბილეთი შეიქმნა — QR ჩანს „ჩემი ბილეთებში“.');
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setError('ქსელის შეცდომა');
    } finally {
      setLoading(false);
    }
  }

  if (remaining <= 0) {
    return (
      <p className="page-lead">
        უფასო ბილეთები: {used} / {quota} გამოყენებული — ახალი გენერაცია აღარ შეიძლება.
      </p>
    );
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 className="section-title">უფასო ბილეთის გენერაცია</h2>
      <p className="page-lead" style={{ marginBottom: '1rem' }}>
        დარჩენილია {remaining} უფასო ბილეთი ({used} / {quota}). შეავსე საკარის მფლობელის მონაცემები.
      </p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="form-field">
          <span>ღონისძიება</span>
          <select name="productSlug" required defaultValue={events[0]?.slug}>
            {events.length === 0 ? (
              <option value="">ღონისძიება არ არის</option>
            ) : (
              events.map((ev) => (
                <option key={ev.slug} value={ev.slug}>
                  {ev.title}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="form-field">
          <span>სახელი (საკარისთვის)</span>
          <input name="firstName" required minLength={2} />
        </label>
        <label className="form-field">
          <span>გვარი</span>
          <input name="lastName" required minLength={2} />
        </label>
        <label className="form-field">
          <span>პირადი ნომერი</span>
          <input name="personalId" required pattern="\d{11}" inputMode="numeric" />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
        <label className="form-field">
          <span>ტელეფონი</span>
          <input name="phone" required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {msg ? <p className="form-ok">{msg}</p> : null}
        <button type="submit" className="btn" disabled={loading || events.length === 0}>
          {loading ? '…' : 'უფასო ბილეთის გენერაცია'}
        </button>
      </form>
    </section>
  );
}
