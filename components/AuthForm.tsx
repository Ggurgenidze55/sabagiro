'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { canAccessAdminPanel, staffAdminLandingPath } from '@/lib/staff-roles';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get('next');
  const next = nextParam || '/account';
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';
  const passwordResetDone = search.get('reset') === '1';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    if (mode === 'register') {
      const facebookUrl = String(payload.facebookUrl ?? '').trim();
      const instagramUrl = String(payload.instagramUrl ?? '').trim();
      if (!facebookUrl && !instagramUrl) {
        setLoading(false);
        setError('Enter at least one profile link — Facebook or Instagram.');
        return;
      }
    }

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

      if (
        mode === 'login' &&
        data.role &&
        canAccessAdminPanel(data.role) &&
        next.startsWith('/account')
      ) {
        router.push(staffAdminLandingPath(data.role));
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
          <fieldset className="form-fieldset">
            <legend className="form-fieldset__legend">Social verification</legend>
            <p className="form-foot" style={{ marginBottom: '0.85rem', opacity: 0.75 }}>
              Add <strong>Facebook</strong> or <strong>Instagram</strong> — at least one is required
              for admin verification.
            </p>
            <label className="form-field">
              <span>Facebook profile link (optional)</span>
              <input
                name="facebookUrl"
                type="url"
                placeholder="https://facebook.com/..."
              />
            </label>
            <label className="form-field">
              <span>Instagram profile link (optional)</span>
              <input
                name="instagramUrl"
                type="url"
                placeholder="https://instagram.com/..."
              />
            </label>
          </fieldset>
          <p className="form-foot" style={{ opacity: 0.7 }}>
            After signup, admin verifies your link(s). You can buy tickets once verified.
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
      {mode === 'login' ? (
        <p className="form-foot" style={{ marginTop: '-0.5rem' }}>
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
      ) : null}
      {passwordResetDone && mode === 'login' ? (
        <p className="form-foot" style={{ color: '#f9c108' }}>
          Password updated. You can log in now.
        </p>
      ) : null}
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
