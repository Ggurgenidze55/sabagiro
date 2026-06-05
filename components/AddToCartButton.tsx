'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/lib/products';
import { readCart, writeCart } from '@/lib/cart';

type AddToCartButtonProps = {
  product: Product;
  label?: string;
  disabled?: boolean;
};

export function AddToCartButton({
  product,
  label = 'ADD TO CART',
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [inCart, setInCart] = useState(false);

  const syncInCart = useCallback(() => {
    setInCart(readCart().some((line) => line.slug === product.slug));
  }, [product.slug]);

  useEffect(() => {
    syncInCart();
    window.addEventListener('storage', syncInCart);
    window.addEventListener('sabagiro-cart-change', syncInCart);
    window.addEventListener('focus', syncInCart);
    return () => {
      window.removeEventListener('storage', syncInCart);
      window.removeEventListener('sabagiro-cart-change', syncInCart);
      window.removeEventListener('focus', syncInCart);
    };
  }, [syncInCart]);

  if (product.type === 'merch') {
    return (
      <p className="notice-banner notice-banner--inline">
        Merch is preview only — buy at the club. Online merch checkout coming soon.
      </p>
    );
  }

  function handleClick() {
    if (disabled || inCart) return;
    const lines = readCart();
    const existing = lines.find((l) => l.slug === product.slug);
    if (existing) {
      router.push('/cart');
      return;
    }
    lines.push({
      slug: product.slug,
      name: product.name,
      priceGel: product.priceGel,
      qty: 1,
      accent: product.accent,
      type: product.type,
    });
    writeCart(lines);
    setInCart(true);
    setAdded(true);
    setTimeout(() => router.push('/cart'), 400);
  }

  if (inCart) {
    return (
      <Link href="/cart" className="btn" style={{ marginTop: '0.5rem' }}>
        IN CART →
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={handleClick}
      disabled={disabled}
      style={{ marginTop: '0.5rem', opacity: disabled ? 0.45 : 1 }}
    >
      {added ? 'ADDED →' : label}
    </button>
  );
}
