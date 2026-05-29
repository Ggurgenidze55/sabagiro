import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SiteChrome } from '@/components/SiteChrome';
import { AuthForm } from '@/components/AuthForm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Log in — Sabagiro' };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/account');

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
