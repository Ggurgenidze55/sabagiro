import { AdminGenerateForm } from '@/components/AdminGenerateForm';
import { getSessionUser } from '@/lib/auth';
import { canUseFullAdminTools, staffDeniedRedirectPath } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Generate ticket — Admin' };

export default async function AdminGeneratePage() {
  const user = await getSessionUser();
  if (!user || !canUseFullAdminTools(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">SEND INVITATION</h1>
        <p className="page-lead">
          Guest name + email. Multiple invitations append Guest 1, Guest 2, … to the last name.
        </p>
      </header>
      <div className="centered-page__body admin-generate-panel">
        <AdminGenerateForm />
      </div>
    </div>
  );
}
