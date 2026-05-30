'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavDropdownItem = {
  href: string;
  label: string;
};

type NavDropdownProps = {
  label: string;
  items: NavDropdownItem[];
  menuLabel?: string;
};

function itemIsCurrent(pathname: string, href: string): boolean {
  if (href === '/account') return pathname === '/account';
  if (href.startsWith('/account/')) return pathname === href || pathname.startsWith(`${href}/`);
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavDropdown({ label, items, menuLabel }: NavDropdownProps) {
  const pathname = usePathname();
  const groupActive = items.some((item) => itemIsCurrent(pathname, item.href));

  return (
    <li className={`site-nav__drop${groupActive ? ' site-nav__drop--active' : ''}`}>
      <span className="site-nav__drop-toggle" aria-haspopup="true">
        {label}
        <span className="site-nav__drop-caret" aria-hidden="true">
          ▾
        </span>
      </span>
      <ul className="site-nav__drop-menu" role="menu" aria-label={menuLabel ?? label}>
        {items.map((item) => (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              role="menuitem"
              aria-current={itemIsCurrent(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
