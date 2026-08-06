import Image from 'next/image';
import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { CLUB_COORDS_LABEL, CLUB_MAPS_URL } from '@/lib/club-location';
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
          <a href={CLUB_MAPS_URL} target="_blank" rel="noopener noreferrer">
            <Image
              src="/club/sabagiro-location.png"
              alt="Sabagiro venue at night"
              width={1200}
              height={1600}
              className="location-map__img"
              priority
            />
          </a>
        </figure>
        <div className="location-info">
          <h2 className="section-title">Find us</h2>
          <p className="page-lead" style={{ lineHeight: 1.8 }}>
            Sabagiro — a former cable car station reimagined. Music · Art · Community.
          </p>
          <ul className="location-list">
            <li>
              <span className="location-list__label">Address</span>
              <span>
                Leo Kvachadze St, Lisi
                <br />
                Saburtalo, Tbilisi 0176
              </span>
            </li>
            <li>
              <span className="location-list__label">City</span>
              <span>Tbilisi</span>
            </li>
            <li>
              <span className="location-list__label">Pin</span>
              <span>{CLUB_COORDS_LABEL}</span>
            </li>
            <li>
              <span className="location-list__label">Doors</span>
              <span>23:00</span>
            </li>
          </ul>
          <div className="cart-actions" style={{ marginTop: '1.5rem' }}>
            <a href={CLUB_MAPS_URL} className="btn" target="_blank" rel="noopener noreferrer">
              OPEN IN MAPS
            </a>
            {user && canPurchaseTickets(user) ? (
              <Link href="/events" className="btn btn--ghost">
                BUY TICKETS
              </Link>
            ) : (
              <Link href={user ? '/account' : '/register'} className="btn btn--ghost">
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
