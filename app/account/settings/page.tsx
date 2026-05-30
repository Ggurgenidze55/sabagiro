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
    <SiteChrome current="settings">
      <div className="settings-page">
        <header className="settings-page__intro">
          <h1 className="page-title">SETTINGS</h1>
          <p className="page-lead">
            Email, phone, and password can be updated. Name/personal ID are locked after registration
          </p>
        </header>
        <ProfileSettings user={user} />
      </div>
    </SiteChrome>
  );
}
