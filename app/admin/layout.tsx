export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/account');

  return (
    <div className="site-shell">
      <header className="site-header admin-header">
        <Link href="/" className="site-brand">
          <span className="site-brand__text">SABAGIRO ADMIN</span>
        </Link>
        <nav aria-label="Admin">
          <ul className="site-nav">
            <li>
              <Link href="/admin">Overview</Link>
            </li>
            <li>
              <Link href="/admin/events">Events</Link>
            </li>
            <li>
              <Link href="/admin/users">Users</Link>
            </li>
            <li>
              <Link href="/admin/tickets">Tickets</Link>
            </li>
            <li>
              <Link href="/admin/generate">Generate QR</Link>
            </li>
            <li>
              <Link href="/account">My account</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="site-main">{children}</main>
    </div>
  );
}
