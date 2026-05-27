import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteChrome } from '@/components/SiteChrome';
import { ProfileSettings } from '@/components/ProfileSettings';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings — Sabagiro' };

export default async function AccountSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/settings');

  return (
    <SiteChrome>
      <Link href="/account" className="back-link">
        ← Account
      </Link>
      <h1 className="page-title">SETTINGS</h1>
      <p className="page-lead">Update email, phone, password</p>
      <ProfileSettings user={user} />
    </SiteChrome>
  );
}
