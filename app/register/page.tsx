import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SiteChrome } from '@/components/SiteChrome';
import { AuthForm } from '@/components/AuthForm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Register — Sabagiro' };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect('/account');

  return (
    <SiteChrome>
      <h1 className="page-title">REGISTER</h1>
      <p className="page-lead">Name, ID, email — used on your ticket QR</p>
      <Suspense fallback={<p className="cart-empty">Loading…</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </SiteChrome>
  );
}
