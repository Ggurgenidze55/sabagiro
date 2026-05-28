'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get('newPassword') ?? '');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }

      router.push('/login?reset=1');
      router.refresh();
    } catch {
      setLoading(false);
      setError('Network error — try again');
    }
  }

  if (!token) {
    return (
      <p className="form-error">
        Missing reset token. <Link href="/forgot-password">Request a new link</Link>.
      </p>
    );
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label className="form-field">
        <span>New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? '…' : 'SET NEW PASSWORD'}
      </button>
      <p className="form-foot">
        <Link href="/login">Back to log in</Link>
      </p>
    </form>
  );
}
