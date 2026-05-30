import Link from 'next/link';
import type { AccountSubNavCurrent } from '@/components/AccountSubNav';
import { AccountSubNavGate } from '@/components/AccountSubNavGate';
import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { SiteNav } from '@/components/SiteNav';
import { getSessionNavUser } from '@/lib/auth';

function accountSubNavCurrent(
  current?: SiteChromeProps['current'],
): AccountSubNavCurrent | undefined {
  if (
    current === 'account' ||
    current === 'settings' ||
    current === 'about' ||
    current === 'contact'
  ) {
    return current;
  }
  return undefined;
}

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'events' | 'cart' | 'account' | 'settings' | 'contact' | 'about';
};

export async function SiteChrome({ children, current }: SiteChromeProps) {
  const user = await getSessionNavUser();

  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
        <header className="site-header">
          <Link href="/" className="site-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/club/sabagiro-logo-white.png"
              alt="Sabagiro"
              width={120}
              height={89}
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
        <main className="site-main">
          {user ? <AccountSubNavGate current={accountSubNavCurrent(current)} /> : null}
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
