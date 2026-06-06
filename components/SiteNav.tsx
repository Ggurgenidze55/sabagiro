import Link from 'next/link';
import { NavDropdown } from '@/components/NavDropdown';
import { LogoutButton } from '@/components/LogoutButton';
import type { SessionNavUser } from '@/lib/auth';
import { ACCOUNT_MENU_ITEMS, ADMIN_MENU_ITEMS } from '@/lib/nav-menus';
import { showCartInNav, showFreeTicketsInNav } from '@/lib/ticket-access';

type SiteNavProps = {
  user: SessionNavUser | null;
  current?: 'events' | 'cart' | 'account' | 'settings' | 'contact' | 'about';
};

export function SiteNav({ user, current }: SiteNavProps) {
  const showCart = showCartInNav(user);
  const showFreeTickets = showFreeTicketsInNav(user);

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
      {showFreeTickets ? (
        <li>
          <Link href="/account/free-tickets" prefetch>
            Free tickets
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
          <NavDropdown
            label="Account"
            items={ACCOUNT_MENU_ITEMS}
            menuLabel="Account menu"
            highlight
          />
          {user.role === 'ADMIN' ? (
            <NavDropdown label="Admin" items={ADMIN_MENU_ITEMS} menuLabel="Admin menu" />
          ) : null}
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
          <li>
            <LogoutButton variant="nav" />
          </li>
        </>
      ) : (
        <>
          <li className="site-nav__highlight">
            <Link href="/login">Log in</Link>
          </li>
          <li>
            <Link href="/register">Register</Link>
          </li>
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
        </>
      )}
    </ul>
  );
}
