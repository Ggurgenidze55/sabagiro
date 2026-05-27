import Link from 'next/link';
import { SiteChrome } from '@/components/SiteChrome';

export default function NotFound() {
  return (
    <SiteChrome>
      <h1 className="page-title">404</h1>
      <p className="page-lead">This page does not exist on Sabagiro.</p>
      <p className="page-lead" style={{ opacity: 0.75, maxWidth: '36rem', lineHeight: 1.7 }}>
        Local dev runs on port <strong>3001</strong> (not 3000 — that is often LariPay). Production:{' '}
        <strong>https://sabagiro.vercel.app</strong>
      </p>
      <div className="cart-actions" style={{ marginTop: '1.5rem' }}>
        <Link href="/" className="btn btn--primary">
          Home
        </Link>
        <Link href="/shop" className="btn btn--ghost">
          Shop
        </Link>
        <Link href="/location" className="btn btn--ghost">
          Location
        </Link>
        <Link href="/login" className="btn btn--ghost">
          Log in
        </Link>
      </div>
    </SiteChrome>
  );
}
