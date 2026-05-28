import type { TierAvailability } from '@/lib/ticket-tiers';
import { formatGel } from '@/lib/products';

export function EventTierList({
  tiers,
  ticketsRemaining,
}: {
  tiers?: TierAvailability[];
  ticketsRemaining?: number;
}) {
  if (!tiers?.length) return null;

  return (
    <div className="tier-list">
      <h2 className="section-title">Ticket waves</h2>
      <ul>
        {tiers.map((tier) => (
          <li key={tier.id} className={tier.remaining > 0 ? 'tier-list__item' : 'tier-list__item tier-list__item--sold'}>
            <span className="tier-list__label">{tier.label}</span>
            <span className="tier-list__price">{formatGel(tier.priceGel)}</span>
            <span className="tier-list__qty">
              {tier.remaining > 0
                ? `${tier.remaining} left of ${tier.quantity}`
                : `Sold out (${tier.quantity})`}
            </span>
          </li>
        ))}
      </ul>
      {ticketsRemaining !== undefined ? (
        <p className="page-lead" style={{ marginTop: '1rem' }}>
          Total tickets left: <strong>{ticketsRemaining}</strong>
        </p>
      ) : null}
    </div>
  );
}
