import { AdminEventsPanel } from '@/components/AdminEventsPanel';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Events — Admin' };

export default function AdminEventsPage() {
  return (
    <>
      <h1 className="page-title">EVENTS</h1>
      <p className="page-lead">Create events for homepage + ticket sales</p>
      <AdminEventsPanel />
    </>
  );
}
