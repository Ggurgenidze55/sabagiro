import Link from 'next/link';
import type { SessionUser } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

type SiteNavProps = {
  user: SessionUser | null;
  current?: 'shop' | 'cart' | 'account' | 'settings';
};

export function SiteNav({ user, current }: SiteNavProps) {
  return (
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
        <li>
          <Link href="/location">Location</Link>
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
    </ul>
  );
}
