'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get('next');
  const next = nextParam || '/account';
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }

      if (mode === 'login' && data.role === 'ADMIN' && next.startsWith('/account')) {
        router.push('/admin');
        router.refresh();
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setLoading(false);
      setError('Network error — try again');
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {mode === 'register' ? (
        <>
          <label className="form-field">
            <span>First name</span>
            <input name="firstName" required minLength={2} />
          </label>
          <label className="form-field">
            <span>Last name</span>
            <input name="lastName" required minLength={2} />
          </label>
          <label className="form-field">
            <span>Personal ID (11 digits)</span>
            <input name="personalId" required pattern="\d{11}" inputMode="numeric" />
          </label>
          <label className="form-field">
            <span>Facebook profile link</span>
            <input
              name="facebookUrl"
              type="url"
              required
              placeholder="https://facebook.com/..."
            />
          </label>
          <label className="form-field">
            <span>Instagram profile link</span>
            <input
              name="instagramUrl"
              type="url"
              required
              placeholder="https://instagram.com/..."
            />
          </label>
          <p className="form-foot" style={{ opacity: 0.7 }}>
            After signup, admin verifies your links. You can buy tickets once verified.
          </p>
        </>
      ) : null}
      <label className="form-field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {mode === 'register' ? (
        <label className="form-field">
          <span>Phone</span>
          <input name="phone" required />
        </label>
      ) : null}
      <label className="form-field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? '…' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
      </button>
      <p className="form-foot">
        {mode === 'login' ? (
          <>
            No account? <Link href={`/register${nextQuery}`}>Register</Link>
          </>
        ) : (
          <>
            Have an account? <Link href={`/login${nextQuery}`}>Log in</Link>
          </>
        )}
      </p>
    </form>
  );
}
