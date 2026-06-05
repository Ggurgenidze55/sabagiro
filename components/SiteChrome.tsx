import Link from 'next/link';
import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { SiteNav } from '@/components/SiteNav';
import { getSessionNavUser } from '@/lib/auth';

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'events' | 'cart' | 'account' | 'settings' | 'contact' | 'about';
  mainClassName?: string;
};

export async function SiteChrome({ children, current, mainClassName }: SiteChromeProps) {
  const user = await getSessionNavUser();

  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
        <header className="site-header">
          <Link href="/" className="site-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/club/sabagiro-mark.png"
              alt="Sabagiro"
              width={126}
              height={67}
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
