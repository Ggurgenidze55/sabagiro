'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isSabagiroAppShell } from '@/lib/app-shell';

type AppBackButtonProps = {
  fallbackHref?: string;
  className?: string;
  label?: string;
  /** Show even on `/` (payment shell). */
  forceShow?: boolean;
};

export function AppBackButton({
  fallbackHref = '/events',
  className = '',
  label = 'Back',
  forceShow = false,
}: AppBackButtonProps) {
  const pathname = usePathname();
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isSabagiroAppShell());
  }, []);

  if (!inApp) return null;
  if (!forceShow && (pathname === '/' || pathname === '')) return null;

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(fallbackHref);
  }

  return (
    <button
      type="button"
      className={['app-back-btn', className].filter(Boolean).join(' ')}
      onClick={handleBack}
      aria-label="Go back"
    >
      <span className="app-back-btn__icon" aria-hidden>
        ←
      </span>
      {label}
    </button>
  );
}
