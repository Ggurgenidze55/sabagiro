import Link from 'next/link';
import { SiteChrome } from '@/components/SiteChrome';
import { formatGel, listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop — Sabagiro',
};

export default async function ShopPage() {
  const products = await listProducts();

  return (
    <SiteChrome current="shop">
      <h1 className="page-title">SHOP</h1>
      <p className="page-lead">Tickets · Merch · Tbilisi</p>

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
            <p className="product-card__price">{formatGel(product.priceGel)}</p>
            <Link href={`/shop/${product.slug}`} className="btn btn--ghost">
              VIEW
            </Link>
          </article>
        ))}
      </div>
    </SiteChrome>
  );
}
