import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
import { SiteChrome } from '@/components/SiteChrome';
import { normalizeEventSlug } from '@/lib/events';
import { formatGel, getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Not found — Sabagiro' };
  return { title: `${product.name} — Sabagiro Shop` };
}

export default async function ProductPage({ params }: PageProps) {
  const decoded = decodeURIComponent(params.slug);
  const canonical = normalizeEventSlug(decoded);
  if (decoded !== canonical) {
    const legacy = await getProduct(decoded);
    if (legacy) redirect(`/shop/${canonical}`);
  }

  const product = await getProduct(params.slug);
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
