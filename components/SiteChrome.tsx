import Image from 'next/image';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { MobileNav } from '@/components/MobileNav';
import { SiteNav } from '@/components/SiteNav';

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'shop' | 'cart' | 'account';
};

export async function SiteChrome({ children, current }: SiteChromeProps) {
  const user = await getSessionUser();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="site-brand">
          <Image
            src="/club/sabagiro-logo-white.png"
            alt="Sabagiro"
            width={120}
            height={89}
            className="site-brand__logo"
            priority
          />
        </Link>
        <MobileNav label="Main">
          <SiteNav user={user} current={current} />
        </MobileNav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>© Sabagiro · Tbilisi · GE</span>
        <Link href="/location" className="site-footer__link">
          Location
        </Link>
      </footer>
    </div>
  );
}
