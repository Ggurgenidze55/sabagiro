import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SiteChrome } from '@/components/SiteChrome';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Reset password — Sabagiro' };

function ResetPasswordInner({ token }: { token: string }) {
  return <ResetPasswordForm token={token} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect('/account');

  const token = searchParams.token ?? '';

  return (
    <SiteChrome>
      <h1 className="page-title">NEW PASSWORD</h1>
      <p className="page-lead">Choose a new password for your account</p>
      <Suspense fallback={<p className="cart-empty">Loading…</p>}>
        <ResetPasswordForm token={token} />
      </Suspense>
    </SiteChrome>
  );
}
