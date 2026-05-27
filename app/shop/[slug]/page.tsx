import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
import { SiteChrome } from '@/components/SiteChrome';
import { formatGel, getProduct, products } from '@/lib/products';

type PageProps = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps) {
  const product = getProduct(params.slug);
  if (!product) return { title: 'Not found — Sabagiro' };
  return { title: `${product.name} — Sabagiro Shop` };
}

export default function ProductPage({ params }: PageProps) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <SiteChrome current="shop">
      <p className="page-lead">{product.tag ?? product.type.toUpperCase()}</p>
      <h1 className="page-title" style={{ color: product.accent }}>
        {product.name}
      </h1>
      <p className="page-lead" style={{ opacity: 0.75, maxWidth: '42rem', lineHeight: 1.8 }}>
        {product.description}
      </p>
      <p className="cart-total" style={{ margin: '1.5rem 0' }}>
        {formatGel(product.priceGel)}
      </p>
      <AddToCartButton product={product} />
      <div className="cart-actions">
        <Link href="/shop" className="btn btn--ghost">
          ← All products
        </Link>
      </div>
    </SiteChrome>
  );
}
