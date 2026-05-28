import { redirect } from 'next/navigation';
import { SiteChrome } from '@/components/SiteChrome';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Forgot password — Sabagiro' };

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect('/account');

  return (
    <SiteChrome>
      <h1 className="page-title">FORGOT PASSWORD</h1>
      <p className="page-lead">We will email you a secure reset link</p>
      <ForgotPasswordForm />
    </SiteChrome>
  );
}
