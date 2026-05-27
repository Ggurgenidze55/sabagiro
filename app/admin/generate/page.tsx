import { AdminGenerateForm } from '@/components/AdminGenerateForm';

export const metadata = { title: 'Generate ticket — Admin' };

export default function AdminGeneratePage() {
  return (
    <>
      <h1 className="page-title">GENERATE TICKET</h1>
      <p className="page-lead">Create QR for a guest — name, ID, email, phone</p>
      <AdminGenerateForm />
    </>
  );
}
