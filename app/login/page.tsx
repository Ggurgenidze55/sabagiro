import { Suspense } from 'react';
import { SiteChrome } from '@/components/SiteChrome';
import { AuthForm } from '@/components/AuthForm';

export const metadata = { title: 'Log in — Sabagiro' };

export default function LoginPage() {
  return (
    <SiteChrome>
      <h1 className="page-title">LOG IN</h1>
      <p className="page-lead">Access your tickets and profile</p>
      <Suspense fallback={<p className="cart-empty">Loading…</p>}>
        <AuthForm mode="login" />
      </Suspense>
    </SiteChrome>
  );
}
