export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminSiteNav } from '@/components/AdminSiteNav';
import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/account');

  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
      <header className="site-header admin-header">
        <Link href="/" className="site-brand">
          <span className="site-brand__text">SABAGIRO ADMIN</span>
        </Link>
        <MobileNav label="Admin">
          <AdminSiteNav />
        </MobileNav>
      </header>
      <main className="site-main">{children}</main>
      <SiteFooter />
      </div>
    </div>
  );
}
