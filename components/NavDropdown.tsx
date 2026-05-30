'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

export type NavDropdownItem = {
  href: string;
  label: string;
};

type NavDropdownProps = {
  label: string;
  items: NavDropdownItem[];
  menuLabel?: string;
};

const MOBILE_NAV_MQ = '(max-width: 768px)';

function itemIsCurrent(pathname: string, href: string): boolean {
  if (href === '/account') return pathname === '/account';
  if (href.startsWith('/account/')) return pathname === href || pathname.startsWith(`${href}/`);
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useIsMobileNav() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function NavDropdown({ label, items, menuLabel }: NavDropdownProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobileNav();
  const groupActive = items.some((item) => itemIsCurrent(pathname, item.href));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  function onToggleClick() {
    if (isMobile) setOpen((v) => !v);
  }

  return (
    <li
      className={[
        'site-nav__drop',
        groupActive ? 'site-nav__drop--active' : '',
        open ? 'site-nav__drop--open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="site-nav__drop-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onToggleClick}
      >
        {label}
        <span className="site-nav__drop-caret" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>
      <ul id={menuId} className="site-nav__drop-menu" role="menu" aria-label={menuLabel ?? label}>
        {items.map((item) => (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              role="menuitem"
              aria-current={itemIsCurrent(pathname, item.href) ? 'page' : undefined}
              onClick={close}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
