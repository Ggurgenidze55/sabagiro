import type { EventPromoStatRow } from '@/lib/admin-promo-stats';

export function AdminEventPromoStatsPanel({ rows }: { rows: EventPromoStatRow[] }) {
  const anySold = rows.some((r) => r.ticketsSold > 0);

  return (
    <section className="admin-ticket-stats admin-promo-stats" aria-label="Promo code statistics">
      <h2 className="admin-section-title">Promo codes</h2>
      <p className="admin-ticket-stats__lead">
        All promo codes for this event · Uses = successful payments (DB counter) · Orders / tickets
        = paid checkouts for this night · Revenue = ₾ charged on event line items (after discount)
      </p>

      {rows.length === 0 ? (
        <p className="cart-empty">No promo codes configured for this event.</p>
      ) : (
        <div className="admin-promo-stats__table-wrap">
          <table className="admin-promo-stats__table">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Off</th>
                <th scope="col">Uses</th>
                <th scope="col">Tickets sold</th>
                <th scope="col">Orders</th>
                <th scope="col">Discount (₾)</th>
                <th scope="col">Revenue (₾)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code}>
                  <td>
                    {row.code}
                    {!row.active ? <span className="table-sub"> · off</span> : null}
                  </td>
                  <td>{row.percentOff}%</td>
                  <td>
                    {row.maxUses != null ? `${row.usedCount} / ${row.maxUses}` : row.usedCount}
                  </td>
                  <td className="admin-ticket-stats__accent">{row.ticketsSold}</td>
                  <td>{row.ordersCount}</td>
                  <td>{row.discountGel}</td>
                  <td>{row.revenueGel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && !anySold ? (
        <p className="admin-ticket-stats__hint" style={{ marginTop: '1rem' }}>
          Codes exist but none used on a completed purchase yet.
        </p>
      ) : null}
    </section>
  );
}
