'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { cartTotal, readCart, writeCart, type CartLine } from '@/lib/cart';
import { formatGel } from '@/lib/products';

type HolderDraft = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

type CartViewProps = {
  purchaseLimitPerEvent?: number;
  purchasedCountBySlug?: Record<string, number>;
  remainingBySlug?: Record<string, number>;
  showLimitDetails?: boolean;
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
  purchaseLimitPerEvent = 1,
  purchasedCountBySlug = {},
  remainingBySlug = {},
  showLimitDetails = false,
}: CartViewProps) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [holderDrafts, setHolderDrafts] = useState<Record<string, HolderDraft>>({});

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

  function getHolderKey(slug: string, index: number) {
    return `${slug}:${index}`;
  }

  function updateHolderField(slug: string, index: number, field: keyof HolderDraft, value: string) {
    const key = getHolderKey(slug, index);
    setHolderDrafts((prev) => ({
      ...prev,
      [key]: (() => {
        const current: HolderDraft = prev[key] ?? {
          firstName: '',
          lastName: '',
          personalId: '',
          email: '',
          phone: '',
        };
        const next: HolderDraft = { ...current };
        next[field] = value;
        return next;
      })(),
    }));
  }

  function hasValidHolder(holder: HolderDraft | undefined) {
    if (!holder) return false;
    return (
      holder.firstName.trim().length >= 2 &&
      holder.lastName.trim().length >= 2 &&
      /^\d{11}$/.test(holder.personalId.trim()) &&
      holder.email.trim().includes('@') &&
      holder.phone.trim().length >= 9
    );
  }

  function clearCart() {
    writeCart([]);
    setLines([]);
    setHolderDrafts({});
  }

  function removeMerch() {
    const next = readCart().filter((line) => line.type !== 'merch');
    writeCart(next);
    setLines(next);
  }

  async function checkout() {
    setError('');
    setCheckingOut(true);

    const ticketItems = ticketLines.map((line) => {
      const holders: HolderDraft[] = [];
      for (let i = 1; i < line.qty; i++) {
        const draft = holderDrafts[getHolderKey(line.slug, i)];
        if (!hasValidHolder(draft)) {
          throw new Error(
            `Please complete holder details for extra ticket #${i + 1} in ${line.name}.`,
          );
        }
        holders.push({
          firstName: draft!.firstName.trim(),
          lastName: draft!.lastName.trim(),
          personalId: draft!.personalId.trim(),
          email: draft!.email.trim(),
          phone: draft!.phone.trim(),
        });
      }
      return { slug: line.slug, qty: line.qty, holders };
    });

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
        setError('ბილეთის ყიდვისთვის საჭიროა ვერიფიკაცია. შეამოწმე ანგარიში.');
      } else if (data.code === 'ALREADY_OWNED' || data.code === 'TICKET_LIMIT') {
        setError(data.error || 'Ticket limit reached');
      } else {
        setError(data.error || 'Checkout failed');
      }
      return;
    }

      clearCart();
      if (typeof data.redirectUrl === 'string' && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (typeof data.orderId === 'string' && data.orderId) {
        router.push(`/payment/return?orderId=${encodeURIComponent(data.orderId)}`);
        return;
      }
      router.push('/account');
      router.refresh();
    } catch (e) {
      setCheckingOut(false);
      setError(e instanceof Error ? e.message : 'Network error — try again');
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
          <Link href="/events" className="btn">
            BROWSE EVENTS
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
            const remaining =
              line.type === 'ticket'
                ? (remainingBySlug[line.slug] ?? maxQtyForTicket(line.slug))
                : purchaseLimitPerEvent;
            const limitReached = line.type === 'ticket' && remaining <= 0;
            return (
              <Fragment key={line.slug}>
            <tr>
              <td style={{ color: line.accent }}>
                {line.name}
                {line.type === 'merch' ? (
                  <span className="table-sub" style={{ display: 'block' }}>
                    Merch · not for online checkout
                  </span>
                ) : null}
                {limitReached ? (
                  showLimitDetails ? (
                    <span className="table-sub" style={{ display: 'block', color: '#ff6688' }}>
                      Purchase limit reached ({purchaseLimitPerEvent}/event)
                    </span>
                  ) : null
                ) : line.type === 'ticket' ? (
                  showLimitDetails ? (
                    <span className="table-sub" style={{ display: 'block' }}>
                      You can still buy {remaining} ticket(s) for this event
                    </span>
                  ) : null
                ) : null}
              </td>
              <td>
                <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, -1)}>
                  −
                </button>
                <span style={{ margin: '0 0.5rem' }}>{line.qty}</span>
                {line.type === 'ticket' ? (
                  <button type="button" className="btn btn--ghost" onClick={() => updateQty(line.slug, 1)}>
                    +
                  </button>
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
            {line.type === 'ticket' && line.qty > 1
              ? Array.from({ length: line.qty - 1 }).map((_, idx) => {
                  const extraIndex = idx + 1;
                  const key = getHolderKey(line.slug, extraIndex);
                  const draft = holderDrafts[key];
                  return (
                    <tr key={`${line.slug}-holder-${extraIndex}`}>
                      <td colSpan={4}>
                        <div className="notice-banner notice-banner--inline" style={{ maxWidth: '100%' }}>
                          <p className="table-sub" style={{ marginBottom: '0.6rem' }}>
                            Extra ticket #{extraIndex + 1} holder details (required)
                          </p>
                          <div className="form-row">
                            <label className="form-field">
                              <span>First name</span>
                              <input
                                value={draft?.firstName ?? ''}
                                onChange={(e) =>
                                  updateHolderField(line.slug, extraIndex, 'firstName', e.target.value)
                                }
                                required
                              />
                            </label>
                            <label className="form-field">
                              <span>Last name</span>
                              <input
                                value={draft?.lastName ?? ''}
                                onChange={(e) =>
                                  updateHolderField(line.slug, extraIndex, 'lastName', e.target.value)
                                }
                                required
                              />
                            </label>
                            <label className="form-field">
                              <span>Personal ID</span>
                              <input
                                value={draft?.personalId ?? ''}
                                onChange={(e) =>
                                  updateHolderField(line.slug, extraIndex, 'personalId', e.target.value)
                                }
                                pattern="\d{11}"
                                inputMode="numeric"
                                required
                              />
                            </label>
                            <label className="form-field">
                              <span>Email</span>
                              <input
                                type="email"
                                value={draft?.email ?? ''}
                                onChange={(e) =>
                                  updateHolderField(line.slug, extraIndex, 'email', e.target.value)
                                }
                                required
                              />
                            </label>
                            <label className="form-field">
                              <span>Phone</span>
                              <input
                                value={draft?.phone ?? ''}
                                onChange={(e) =>
                                  updateHolderField(line.slug, extraIndex, 'phone', e.target.value)
                                }
                                required
                              />
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
              </Fragment>
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
            ticketLines.some((line) => {
              const remaining = remainingBySlug[line.slug] ?? maxQtyForTicket(line.slug);
              return remaining <= 0;
            })
          }
        >
          {checkingOut ? 'PROCESSING…' : 'BUY TICKETS'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clearCart}>
          Clear
        </button>
        <Link href="/events" className="btn btn--ghost">
          Continue to events
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
