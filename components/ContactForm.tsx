'use client';

import { useState } from 'react';

export function ContactForm() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk(false);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      topic: String(fd.get('topic') ?? 'other'),
      message: String(fd.get('message') ?? ''),
      company: String(fd.get('company') ?? ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Could not send message');
        return;
      }

      setOk(true);
      e.currentTarget.reset();
    } catch {
      setLoading(false);
      setError('Network error — try again or email info@sabagiro.ge');
    }
  }

  if (ok) {
    return (
      <div className="contact-form contact-form--ok">
        <p className="form-ok">Message sent. We will reply to your email as soon as we can.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setOk(false)}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="form-stack contact-form" onSubmit={onSubmit}>
      <label className="form-field">
        <span>Name</span>
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" />
      </label>
      <label className="form-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="form-field">
        <span>Topic</span>
        <select name="topic" defaultValue="tickets">
          <option value="tickets">Tickets & orders</option>
          <option value="events">Events & lineup</option>
          <option value="press">Press & partnerships</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="form-field">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} />
      </label>
      <label className="contact-form__honeypot" aria-hidden="true">
        <span>Company</span>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? 'SENDING…' : 'SEND MESSAGE'}
      </button>
    </form>
  );
}
