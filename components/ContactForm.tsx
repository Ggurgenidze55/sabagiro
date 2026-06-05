'use client';

import { useState } from 'react';
import type { ContactTopic } from '@/lib/contact-topic';
import { CONTACT_TOPICS, contactTopicLabel } from '@/lib/contact-topic';

export function ContactForm() {
  const [topic, setTopic] = useState<ContactTopic>('tickets');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError('');
    setOk(false);
    setLoading(true);

    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      topic,
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

      if (!res.ok) {
        setError(data.error || 'Could not send message');
        return;
      }

      form.reset();
      setTopic('tickets');
      setOk(true);
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      setError(
        detail
          ? `Could not send (${detail}). Try info@sabagiro.ge`
          : 'Network error — try again or email info@sabagiro.ge',
      );
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="contact-form contact-form--ok">
        <p className="form-ok">
          Message sent. Check your inbox (and spam) for a confirmation. We reply within 1–2 days.
        </p>
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
        <select
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          required
        >
          {CONTACT_TOPICS.map((id) => (
            <option key={id} value={id}>
              {contactTopicLabel(id)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={3} />
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
