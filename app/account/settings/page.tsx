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
    <SiteChrome current="account">
      <h1 className="page-title">SETTINGS</h1>
      <p className="page-lead">Email, ტელეფონი და პაროლი — სახელი/გვარი/პირადი ნომერი უცვლელია</p>
      <ProfileSettings user={user} />
    </SiteChrome>
  );
}
