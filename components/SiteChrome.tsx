import Link from 'next/link';
import { getSessionNavUser } from '@/lib/auth';
import { MobileNav } from '@/components/MobileNav';
import { SiteNav } from '@/components/SiteNav';
import { PoweredByCredit } from '@/components/PoweredByCredit';
import { INSTAGRAM_URL } from '@/lib/social';

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'events' | 'cart' | 'account' | 'settings' | 'contact' | 'about';
};

export async function SiteChrome({ children, current }: SiteChromeProps) {
  const user = await getSessionNavUser();

  return (
    <div className="site-shell">
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
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer__row">
        <span>© Sabagiro · Tbilisi · GE</span>
        <div className="site-footer__links">
          <Link href="/events" className="site-footer__link">
            Events
          </Link>
          <Link href="/about" className="site-footer__link">
            About
          </Link>
          <Link href="/contact" className="site-footer__link">
            Contact
          </Link>
          <Link href="/location" className="site-footer__link">
            Location
          </Link>
          <a
            href={INSTAGRAM_URL}
            className="site-footer__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </div>
        </div>
        <PoweredByCredit className="site-footer__powered" />
      </footer>
    </div>
  );
}
