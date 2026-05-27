'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cartTotal, readCart, writeCart, type CartLine } from '@/lib/cart';
import { formatGel } from '@/lib/products';

export function CartView() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLines(readCart());
    setReady(true);
  }, []);

  function updateQty(slug: string, delta: number) {
    const next = readCart()
      .map((line) => (line.slug === slug ? { ...line, qty: line.qty + delta } : line))
      .filter((line) => line.qty > 0);
    writeCart(next);
    setLines(next);
  }

  function clearCart() {
    writeCart([]);
    setLines([]);
  }

  async function checkout() {
    setError('');
    setCheckingOut(true);
    const ticketItems = lines
      .filter((line) => line.type === 'ticket')
      .map((line) => ({ slug: line.slug, qty: line.qty }));

    if (ticketItems.length === 0) {
      setError('Only event tickets can be purchased here. Remove merch or add tickets.');
      setCheckingOut(false);
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: ticketItems }),
    });
    const data = await res.json();
    setCheckingOut(false);

    if (res.status === 401) {
      router.push('/login?next=/cart');
      return;
    }
    if (!res.ok) {
      setError(data.error || 'Checkout failed');
      return;
    }

    clearCart();
    router.push('/account');
    router.refresh();
  }

  const total = cartTotal(lines);

  if (!ready) {
    return <p className="cart-empty">Loading cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <>
        <p className="cart-empty">Cart is empty</p>
        <div className="cart-actions">
          <Link href="/shop" className="btn">
            GO TO SHOP
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.slug}>
              <td style={{ color: line.accent }}>{line.name}</td>
              <td>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, -1)}>
                  −
                </button>
                <span style={{ margin: '0 0.5rem' }}>{line.qty}</span>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, 1)}>
                  +
                </button>
              </td>
              <td>{formatGel(line.priceGel * line.qty)}</td>
              <td>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, -line.qty)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-actions">
        <p className="cart-total">Total {formatGel(total)}</p>
        <button type="button" className="btn" onClick={checkout} disabled={checkingOut}>
          {checkingOut ? 'PROCESSING…' : 'BUY TICKETS'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clearCart}>
          Clear
        </button>
        <Link href="/shop" className="btn btn--ghost">
          Continue shopping
        </Link>
      </div>
      {error ? <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p> : null}
      <p className="page-lead" style={{ marginTop: '1.5rem' }}>
        Log in to complete purchase. QR ticket is emailed and shown in your account.
      </p>
    </>
  );
}
