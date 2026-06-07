import Link from 'next/link';
import { AppBackButton } from '@/components/AppBackButton';
import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { SiteNav } from '@/components/SiteNav';
import { getSessionNavUser } from '@/lib/auth';

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'events' | 'account' | 'settings' | 'contact' | 'about';
  mainClassName?: string;
};

export async function SiteChrome({ children, current, mainClassName }: SiteChromeProps) {
  const user = await getSessionNavUser();

  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
        <header className="site-header">
          <AppBackButton className="site-header__back" fallbackHref="/events" />
          <Link href="/" className="site-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/club/sabagiro-logo-2.png"
              alt="Sabagiro"
              width={170}
              height={74}
              className="site-brand__logo"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
          <MobileNav label="Main">
            <SiteNav user={user} current={current} />
          </MobileNav>
          <span className="site-header__meta">Tbilisi · GE</span>
        </header>
        <main className={['site-main', mainClassName].filter(Boolean).join(' ')}>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
