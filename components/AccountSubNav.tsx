'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

export type AccountSubNavCurrent = 'account' | 'settings' | 'about' | 'contact';

function resolveCurrent(pathname: string): AccountSubNavCurrent | undefined {
  if (pathname.startsWith('/account/settings')) return 'settings';
  if (pathname === '/about' || pathname.startsWith('/about/')) return 'about';
  if (pathname === '/contact' || pathname.startsWith('/contact/')) return 'contact';
  if (pathname === '/account' || pathname.startsWith('/account/')) return 'account';
  return undefined;
}

export function AccountSubNav({ current: currentOverride }: { current?: AccountSubNavCurrent }) {
  const pathname = usePathname();
  const current = currentOverride ?? resolveCurrent(pathname);

  return (
    <nav className="account-subnav" aria-label="Account">
      <ul className="account-subnav__list">
        <li>
          <Link href="/account" aria-current={current === 'account' ? 'page' : undefined}>
            Tickets
          </Link>
        </li>
        <li>
          <Link
            href="/account/settings"
            aria-current={current === 'settings' ? 'page' : undefined}
          >
            Settings
          </Link>
        </li>
        <li>
          <Link href="/about" aria-current={current === 'about' ? 'page' : undefined}>
            About
          </Link>
        </li>
        <li>
          <Link href="/contact" aria-current={current === 'contact' ? 'page' : undefined}>
            Contact
          </Link>
        </li>
        <li className="account-subnav__logout">
          <LogoutButton variant="nav" />
        </li>
      </ul>
    </nav>
  );
}
