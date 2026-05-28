'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { cartTotal, readCart, writeCart, type CartLine } from '@/lib/cart';
import { formatGel } from '@/lib/products';

type CartViewProps = {
  ownedEventSlugs?: string[];
  purchaseLimitPerEvent?: number;
  purchasedCountBySlug?: Record<string, number>;
  remainingBySlug?: Record<string, number>;
};

function normalizeCartTickets(
  lines: CartLine[],
  purchaseLimitPerEvent: number,
  purchasedCountBySlug: Record<string, number>,
) {
  let changed = false;
  const next = lines.map((line) => {
    if (line.type !== 'ticket') return line;
    const purchased = purchasedCountBySlug[line.slug] ?? 0;
    const maxInCart = Math.max(0, purchaseLimitPerEvent - purchased);
    if (line.qty > maxInCart) {
      changed = true;
      return { ...line, qty: Math.max(0, maxInCart) };
    }
    return line;
  }).filter((line) => line.qty > 0);
  if (changed) writeCart(next);
  return next;
}

export function CartView({
  ownedEventSlugs = [],
  purchaseLimitPerEvent = 1,
  purchasedCountBySlug = {},
  remainingBySlug = {},
}: CartViewProps) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLines(normalizeCartTickets(readCart(), purchaseLimitPerEvent, purchasedCountBySlug));
    setReady(true);
  }, [purchaseLimitPerEvent, purchasedCountBySlug]);

  const ticketLines = useMemo(() => lines.filter((line) => line.type === 'ticket'), [lines]);
  const merchLines = useMemo(() => lines.filter((line) => line.type === 'merch'), [lines]);
  const ticketTotal = useMemo(() => cartTotal(ticketLines), [ticketLines]);

  function maxQtyForTicket(slug: string) {
    const purchased = purchasedCountBySlug[slug] ?? 0;
    return Math.max(0, purchaseLimitPerEvent - purchased);
  }

  function updateQty(slug: string, delta: number) {
    const current = readCart().find((line) => line.slug === slug);
    if (current?.type === 'ticket' && delta > 0) {
      const maxQty = maxQtyForTicket(slug);
      if (current.qty >= maxQty) return;
    }

    const next = readCart()
      .map((line) => (line.slug === slug ? { ...line, qty: line.qty + delta } : line))
      .filter((line) => line.qty > 0);
    writeCart(normalizeCartTickets(next, purchaseLimitPerEvent, purchasedCountBySlug));
    setLines(readCart());
  }

  function clearCart() {
    writeCart([]);
    setLines([]);
  }

  function removeMerch() {
    const next = readCart().filter((line) => line.type !== 'merch');
    writeCart(next);
    setLines(next);
  }

  async function checkout() {
    setError('');
    setCheckingOut(true);

    const ticketItems = ticketLines.map((line) => ({ slug: line.slug, qty: line.qty }));

    if (ticketItems.length === 0) {
      setError('Add at least one event ticket to checkout.');
      setCheckingOut(false);
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ticketItems }),
      });
      const data = await res.json().catch(() => ({}));
      setCheckingOut(false);

      if (res.status === 401) {
        router.push('/login?next=/cart');
        return;
      }
    if (!res.ok) {
      if (data.code === 'NOT_VERIFIED') {
        setError('Your account must be verified before buying tickets. Check /account.');
      } else if (data.code === 'ALREADY_OWNED' || data.code === 'TICKET_LIMIT') {
        setError(data.error || 'Ticket limit reached');
      } else {
        setError(data.error || 'Checkout failed');
      }
      return;
    }

      clearCart();
      router.push('/account');
      router.refresh();
    } catch {
      setCheckingOut(false);
      setError('Network error — try again');
    }
  }

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
      {merchLines.length > 0 ? (
        <div className="notice-banner" role="status">
          <p>
            Merch cannot be purchased online yet — remove merch items or collect at the club. Only
            event tickets are sold here.
          </p>
          <button type="button" className="btn btn--ghost" onClick={removeMerch}>
            Remove merch
          </button>
        </div>
      ) : null}

      <div className="table-scroll">
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
          {lines.map((line) => {
            const remaining = remainingBySlug[line.slug] ?? purchaseLimitPerEvent;
            const limitReached = line.type === 'ticket' && remaining <= 0;
            return (
            <tr key={line.slug}>
              <td style={{ color: line.accent }}>
                {line.name}
                {line.type === 'merch' ? (
                  <span className="table-sub" style={{ display: 'block' }}>
                    Merch · not for online checkout
                  </span>
                ) : null}
                {limitReached ? (
                  <span className="table-sub" style={{ display: 'block', color: '#ff6688' }}>
                    ყიდვის ლიმიტი ამოიწურა ({purchaseLimitPerEvent}/ივენთი)
                  </span>
                ) : line.type === 'ticket' ? (
                  <span className="table-sub" style={{ display: 'block' }}>
                    კიდევ შეგიძლია {remaining} ბილეთის ყიდვა
                  </span>
                ) : null}
              </td>
              <td>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, -1)}>
                  −
                </button>
                <span style={{ margin: '0 0.5rem' }}>{line.qty}</span>
                {line.type === 'ticket' ? (
                  <span className="table-sub" style={{ marginLeft: '0.35rem' }}>
                    max {maxQtyForTicket(line.slug)}
                  </span>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, 1)}>
                    +
                  </button>
                )}
              </td>
              <td>{formatGel(line.priceGel * line.qty)}</td>
              <td>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, -line.qty)}>
                  Remove
                </button>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
      </div>
      <div className="cart-actions">
        <p className="cart-total">
          Tickets total {formatGel(ticketTotal)}
          {merchLines.length > 0 ? (
            <span className="cart-total__note"> · Merch not included in checkout</span>
          ) : null}
        </p>
        <button
          type="button"
          className="btn"
          onClick={checkout}
          disabled={
            checkingOut ||
            ticketLines.length === 0 ||
            ticketLines.some((line) => (remainingBySlug[line.slug] ?? 0) <= 0)
          }
        >
          {checkingOut ? 'PROCESSING…' : 'BUY TICKETS'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clearCart}>
          Clear
        </button>
        <Link href="/shop" className="btn btn--ghost">
          Continue shopping
        </Link>
      </div>
      {error ? (
        <p className="form-error" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}
      <p className="page-lead" style={{ marginTop: '1.5rem' }}>
        Log in to complete purchase. QR ticket is emailed and shown in your account.
      </p>
    </>
  );
}
