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
    <section className="tier-list event-page__tiers" aria-labelledby="ticket-waves-heading">
      <h2 className="event-page__section-label" id="ticket-waves-heading">
        Ticket waves
      </h2>
      <ul>
        {tiers.map((tier) => (
          <li
            key={tier.id}
            className={
              tier.remaining > 0 ? 'tier-list__item' : 'tier-list__item tier-list__item--sold'
            }
          >
            <span className="tier-list__label">{tier.label || 'Standard'}</span>
            <span className="tier-list__price">{formatGel(tier.priceGel)}</span>
            <span className="tier-list__qty">
              {tier.remaining > 0
                ? `${tier.remaining} / ${tier.quantity}`
                : `Sold out · ${tier.quantity}`}
            </span>
          </li>
        ))}
      </ul>
      {ticketsRemaining !== undefined ? (
        <p className="tier-list__total">
          Total available: <strong>{ticketsRemaining}</strong>
        </p>
      ) : null}
    </section>
  );
}
