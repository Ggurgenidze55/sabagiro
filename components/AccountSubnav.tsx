'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/account', label: 'Tickets' },
  { href: '/account/settings', label: 'Settings' },
];

export function AccountSubnav() {
  const pathname = usePathname();

  return (
    <nav className="account-subnav" aria-label="Account">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
