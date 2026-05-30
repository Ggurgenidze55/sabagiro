import Link from 'next/link';
import { NavDropdown } from '@/components/NavDropdown';
import { LogoutButton } from '@/components/LogoutButton';
import { ACCOUNT_MENU_ITEMS, ADMIN_MENU_ITEMS } from '@/lib/nav-menus';

/** Admin header — same top links as main site + Admin dropdown. */
export function AdminSiteNav() {
  return (
    <ul className="site-nav">
      <NavDropdown label="Account" items={ACCOUNT_MENU_ITEMS} menuLabel="Account menu" />
      <NavDropdown label="Admin" items={ADMIN_MENU_ITEMS} menuLabel="Admin menu" />
      <li>
        <Link href="/about">About</Link>
      </li>
      <li>
        <Link href="/contact">Contact</Link>
      </li>
      <li>
        <LogoutButton variant="nav" />
      </li>
    </ul>
  );
}
