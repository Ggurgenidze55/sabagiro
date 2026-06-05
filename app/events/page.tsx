import Link from 'next/link';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { formatGel, listTicketProducts } from '@/lib/products';

export const revalidate = 30;

export const metadata = {
  title: 'Events — Sabagiro',
  description: 'Upcoming Sabagiro club events and tickets in Tbilisi.',
};

export default async function EventsPage() {
  const user = await getSessionUser();
  const products = await listTicketProducts();

  return (
    <SiteChrome current="events">
      <h1 className="page-title">EVENTS</h1>
      <p className="page-lead">Upcoming nights · Tickets · Tbilisi</p>
      <TicketAccessNotice user={user} className="events-page__access" />

      {products.length === 0 ? (
        <p className="cart-empty">
          No events published yet. <Link href="/">Back to home</Link>
        </p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article
              key={product.slug}
              className="product-card"
              style={{ ['--card-accent' as string]: product.accent }}
            >
              {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
              <h2 className="product-card__title">{product.name}</h2>
              {product.lineup ? <p className="product-card__lineup">{product.lineup}</p> : null}
              {product.venueTag ? <p className="product-card__venue-tag">{product.venueTag}</p> : null}
              {!product.lineup && !product.venueTag ? (
                <p className="product-card__meta">{product.description}</p>
              ) : null}
              <p className="product-card__price">
                {product.isFreeEntry
                  ? 'Free entry'
                  : product.ticketsRemaining === 0
                    ? 'Sold out'
                    : formatGel(product.priceFromGel ?? product.priceGel)}
              </p>
              <Link href={`/events/${product.slug}`} className="btn btn--ghost">
                {product.isFreeEntry
                  ? 'FREE ENTRY'
                  : product.ticketsRemaining === 0
                    ? 'VIEW'
                    : 'GET TICKETS'}
              </Link>
            </article>
          ))}
        </div>
      )}
    </SiteChrome>
  );
}
