'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useState, type ReactNode } from 'react';

type MobileNavProps = {
  children: ReactNode;
  label?: string;
};

export function MobileNav({ children, label = 'Menu' }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.body.classList.add('nav-lock');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('nav-lock');
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`mobile-nav${open ? ' mobile-nav--open' : ''}`}>
      <button
        type="button"
        className="mobile-nav__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <button
        type="button"
        className="mobile-nav__backdrop"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <div
        id={panelId}
        className="mobile-nav__panel"
        role="navigation"
        aria-label={label}
      >
        <div className="mobile-nav__head">
          <Link href="/" className="mobile-nav__logo-link" onClick={() => setOpen(false)}>
            <Image
              src="/club/sabagiro-logo-white.png"
              alt="Sabagiro"
              width={120}
              height={89}
              className="mobile-nav__logo"
            />
          </Link>
          <button
            type="button"
            className="mobile-nav__close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('a')) setOpen(false);
          }}
        >
        {children}
        </div>
      </div>
    </div>
  );
}
