import Link from 'next/link';
import type { SessionNavUser } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { showCartInNav } from '@/lib/ticket-access';

type SiteNavProps = {
  user: SessionNavUser | null;
  current?: 'events' | 'cart' | 'account' | 'settings' | 'contact' | 'about';
};

export function SiteNav({ user, current }: SiteNavProps) {
  const showCart = showCartInNav(user);

  return (
    <ul className="site-nav">
        <li>
          <Link href="/" prefetch>
            Home
          </Link>
        </li>
        <li>
          <Link href="/events" prefetch aria-current={current === 'events' ? 'page' : undefined}>
            Events
          </Link>
        </li>
        {showCart ? (
          <li>
            <Link href="/cart" prefetch aria-current={current === 'cart' ? 'page' : undefined}>
              Cart
            </Link>
          </li>
        ) : null}
        <li>
          <Link href="/location" prefetch>
            Location
          </Link>
        </li>
        {user ? (
          <>
            <li>
              <Link href="/account" aria-current={current === 'account' ? 'page' : undefined}>
                Tickets
              </Link>
            </li>
            <li>
              <Link href="/account/settings" aria-current={current === 'settings' ? 'page' : undefined}>
                Settings
              </Link>
            </li>
            {user.role === 'ADMIN' ? (
              <li>
                <Link href="/admin">Admin</Link>
              </li>
            ) : null}
            <li className="site-nav__action">
              <LogoutButton />
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/login">Log in</Link>
            </li>
            <li>
              <Link href="/register">Register</Link>
            </li>
          </>
        )}
        <li>
          <Link href="/about" prefetch aria-current={current === 'about' ? 'page' : undefined}>
            About
          </Link>
        </li>
        <li>
          <Link href="/contact" prefetch aria-current={current === 'contact' ? 'page' : undefined}>
            Contact
          </Link>
        </li>
    </ul>
  );
}
