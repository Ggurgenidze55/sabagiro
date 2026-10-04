import { redirect } from 'next/navigation';
import { AdminPromoCodesPanel } from '@/components/AdminPromoCodesPanel';
import { getSessionUser } from '@/lib/auth';
import { canUseFullAdminTools, staffDeniedRedirectPath } from '@/lib/staff-roles';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Promo codes — Admin' };

export default async function AdminPromoCodesPage() {
  const user = await getSessionUser();
  if (!user || !canUseFullAdminTools(user.role)) redirect(staffDeniedRedirectPath(user?.role));

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">PROMO CODES</h1>
        <p className="page-lead">Percent discount · one event per code · checkout on event page</p>
      </header>
      <div className="centered-page__body">
        <AdminPromoCodesPanel />
      </div>
    </div>
  );
}
