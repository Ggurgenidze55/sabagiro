'use client';

import Link from 'next/link';
import { useState } from 'react';

export function ForgotPasswordForm() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '').trim();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }

      setMessage(data.message || 'If that email is registered, we sent a reset link.');
    } catch {
      setLoading(false);
      setError('Network error — try again');
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label className="form-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-foot" style={{ color: '#f9c108' }}>{message}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? '…' : 'SEND RESET LINK'}
      </button>
      <p className="form-foot">
        <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}
