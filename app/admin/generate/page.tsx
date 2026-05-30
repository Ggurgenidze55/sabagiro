import { AdminGenerateForm } from '@/components/AdminGenerateForm';

export const metadata = { title: 'Generate ticket — Admin' };

export default function AdminGeneratePage() {
  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">GENERATE TICKET</h1>
        <p className="page-lead">Create QR for a guest — name, ID, email, phone</p>
      </header>
      <div className="centered-page__body admin-generate-panel">
        <AdminGenerateForm />
      </div>
    </div>
  );
}
