'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/lib/products';
import { readCart, writeCart } from '@/lib/cart';

type AddToCartButtonProps = {
  product: Product;
  label?: string;
};

export function AddToCartButton({ product, label = 'ADD TO CART' }: AddToCartButtonProps) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleClick() {
    const lines = readCart();
    const existing = lines.find((l) => l.slug === product.slug);
    if (existing) {
      existing.qty += 1;
    } else {
      lines.push({
        slug: product.slug,
        name: product.name,
        priceGel: product.priceGel,
        qty: 1,
        accent: product.accent,
        type: product.type,
      });
    }
    writeCart(lines);
    setAdded(true);
    setTimeout(() => router.push('/cart'), 400);
  }

  return (
    <button type="button" className="btn" onClick={handleClick} style={{ marginTop: '0.5rem' }}>
      {added ? 'ADDED →' : label}
    </button>
  );
}
