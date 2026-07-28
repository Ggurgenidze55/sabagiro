import { AdminGenerateForm } from '@/components/AdminGenerateForm';
import { AdminVerifiedInvitesPanel } from '@/components/AdminVerifiedInvitesPanel';
import { SectionDivider } from '@/components/SectionDivider';
import { getSessionUser } from '@/lib/auth';
import { canUseFullAdminTools, staffDeniedRedirectPath } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Send invitation — Admin' };

export default async function AdminGeneratePage() {
  const user = await getSessionUser();
  if (!user || !canUseFullAdminTools(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">SEND INVITATION</h1>
        <p className="page-lead">
          Email all verified members for an event, or send individual guest invitations.
        </p>
      </header>
      <div className="centered-page__body admin-generate-panel">
        <AdminVerifiedInvitesPanel />
        <SectionDivider index={2} className="admin-generate-panel__rule" />
        <AdminGenerateForm />
      </div>
    </div>
  );
}
