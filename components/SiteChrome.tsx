import Image from 'next/image';
import Link from 'next/link';

type SiteChromeProps = {
  children: React.ReactNode;
  current?: 'shop' | 'cart';
};

export function SiteChrome({ children, current }: SiteChromeProps) {
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
        <nav aria-label="Main">
          <ul className="site-nav">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/shop" aria-current={current === 'shop' ? 'page' : undefined}>
                Shop
              </Link>
            </li>
            <li>
              <Link href="/cart" aria-current={current === 'cart' ? 'page' : undefined}>
                Cart
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">© Sabagiro · Tbilisi · GE</footer>
    </div>
  );
}
