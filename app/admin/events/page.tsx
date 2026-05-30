import { AdminEventsPanel } from '@/components/AdminEventsPanel';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Events — Admin' };

export default function AdminEventsPage() {
  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">EVENTS</h1>
        <p className="page-lead">Create events for homepage + ticket sales</p>
      </header>
      <div className="centered-page__body">
        <AdminEventsPanel />
      </div>
    </div>
  );
}
