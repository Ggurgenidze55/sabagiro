import { redirect } from 'next/navigation';
import { AdminEventsPanel } from '@/components/AdminEventsPanel';
import { getSessionUser } from '@/lib/auth';
import { canCreateEvents, canEditEvents, canViewEventsAdmin } from '@/lib/staff-roles';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Events — Admin' };

export default async function AdminEventsPage() {
  const user = await getSessionUser();
  if (!user || !canViewEventsAdmin(user.role)) redirect('/account');

  const canCreate = canCreateEvents(user.role);
  const canEdit = canEditEvents(user.role);

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">EVENTS</h1>
        <p className="page-lead">
          {canCreate && !canEdit
            ? 'Create new events for homepage + ticket sales'
            : canEdit && !canCreate
              ? 'Edit published events and homepage season'
              : 'Create and manage events for homepage + ticket sales'}
        </p>
      </header>
      <div className="centered-page__body">
        <AdminEventsPanel canCreate={canCreate} canEdit={canEdit} />
      </div>
    </div>
  );
}
