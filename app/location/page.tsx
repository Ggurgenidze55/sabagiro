import Image from 'next/image';
import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { canPurchaseTickets } from '@/lib/verification';

export const metadata = {
  title: 'Location — Sabagiro',
  description: 'Sabagiro club location — Tbilisi, Georgia.',
};

export default async function LocationPage() {
  const user = await getSessionUser();

  return (
    <SiteChrome>
      <h1 className="page-title">LOCATION</h1>
      <p className="page-lead">Tbilisi · Georgia · Doors 23:00</p>
      <TicketAccessNotice user={user} />

      <SectionDivider className="section-divider--first" />

      <div className="location-block">
        <figure className="location-map">
          <Image
            src="/club/sabagiro-location.png"
            alt="Sabagiro venue map"
            width={900}
            height={600}
            className="location-map__img"
            priority
          />
        </figure>
        <div className="location-info">
          <h2 className="section-title">Find us</h2>
          <p className="page-lead" style={{ lineHeight: 1.8 }}>
            Sabagiro — brutalist underground venue. Open air &amp; warehouse nights. Exact pin shared
            with ticket holders by email before each event.
          </p>
          <ul className="location-list">
            <li>
              <span className="location-list__label">City</span>
              <span>Tbilisi</span>
            </li>
            <li>
              <span className="location-list__label">Doors</span>
              <span>23:00</span>
            </li>
          </ul>
          <div className="cart-actions" style={{ marginTop: '1.5rem' }}>
            {user && canPurchaseTickets(user) ? (
              <Link href="/events" className="btn">
                BUY TICKETS
              </Link>
            ) : (
              <Link href={user ? '/account' : '/register'} className="btn">
                {user ? 'Account' : 'Register'}
              </Link>
            )}
            <Link href="/" className="btn btn--ghost">
              Home
            </Link>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
