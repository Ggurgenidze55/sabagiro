import Link from 'next/link';
import { SiteChrome } from '@/components/SiteChrome';
import { formatGel, listTicketProducts } from '@/lib/products';

export const revalidate = 30;

export const metadata = {
  title: 'Events — Sabagiro',
  description: 'Upcoming Sabagiro club events and tickets in Tbilisi.',
};

export default async function EventsPage() {
  const products = await listTicketProducts();

  return (
    <SiteChrome current="events">
      <h1 className="page-title">EVENTS</h1>
      <p className="page-lead">Upcoming nights · Tickets · Tbilisi</p>

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
              <p className="product-card__meta">{product.description}</p>
              <p className="product-card__price">
                {product.ticketsRemaining === 0
                  ? 'Sold out'
                  : formatGel(product.priceFromGel ?? product.priceGel)}
              </p>
              <Link href={`/events/${product.slug}`} className="btn btn--ghost">
                {product.ticketsRemaining === 0 ? 'VIEW' : 'GET TICKETS'}
              </Link>
            </article>
          ))}
        </div>
      )}
    </SiteChrome>
  );
}
