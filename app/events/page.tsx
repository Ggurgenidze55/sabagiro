import Link from 'next/link';
import { EventsPagination } from '@/components/EventsPagination';
import { TicketAccessNotice } from '@/components/TicketAccessNotice';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { isPastEventDate } from '@/lib/event-past';
import {
  getEventPublicDescription,
  getPublicEventCtaLabel,
  getPublicEventPriceDisplay,
} from '@/lib/event-price-display';
import { showsOnlineInvitationForUser } from '@/lib/free-entry-access';
import { formatDoorsOpenLabel } from '@/lib/format-doors-open';
import { listTicketProductsPaginated } from '@/lib/products';

export const revalidate = 30;

export const metadata = {
  title: 'Events — Sabagiro',
  description: 'Sabagiro events archive — upcoming and past nights in Tbilisi.',
};

type PageProps = {
  searchParams: { page?: string };
};

function parseEventsPage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const requestedPage = parseEventsPage(searchParams.page);
  const { products, total, totalPages, page } = await listTicketProductsPaginated(requestedPage);

  return (
    <SiteChrome current="events">
      <h1 className="page-title">EVENTS</h1>
      <p className="page-lead">
        All nights · Upcoming &amp; past · {total} published
        {totalPages > 1 ? ` · page ${page}/${totalPages}` : ''}
      </p>
      <TicketAccessNotice user={user} className="events-page__access" />

      {products.length === 0 ? (
        <p className="cart-empty">
          No events published yet. <Link href="/">Back to home</Link>
        </p>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => {
              const eventMeta = {
                isFreeEntry: Boolean(product.isFreeEntry),
                freeEntryAccess: product.freeEntryAccess ?? 'INVITED_ONLY',
              };
              const showInvitationPrice = showsOnlineInvitationForUser(user, eventMeta);
              const past = isPastEventDate(product.eventDate);
              const priceLabel = getPublicEventPriceDisplay({
                isLoggedIn: Boolean(user),
                isFreeEntry: Boolean(product.isFreeEntry),
                hasFreeTicketAccess: showInvitationPrice,
                priceGel: product.priceGel,
                ticketsRemaining: past ? 0 : product.ticketsRemaining,
              });
              const doorsOpenLabel = formatDoorsOpenLabel(product.doorsOpen);

              return (
                <article
                  key={product.slug}
                  className={`product-card${past ? ' product-card--past' : ''}`}
                  style={{ ['--card-accent' as string]: product.accent }}
                >
                  {past ? <span className="product-card__tag product-card__tag--past">Past</span> : null}
                  {!past && product.tag ? (
                    <span className="product-card__tag">{product.tag}</span>
                  ) : null}
                  {past && product.tag ? (
                    <span className="product-card__meta product-card__meta--date">{product.tag}</span>
                  ) : null}
                  <h2 className="product-card__title">{product.name}</h2>
                  {product.lineup ? <p className="product-card__lineup">{product.lineup}</p> : null}
                  {doorsOpenLabel ? <p className="product-card__doors-open">{doorsOpenLabel}</p> : null}
                  {product.venueTag ? <p className="product-card__venue-tag">{product.venueTag}</p> : null}
                  <p className="product-card__meta">
                    {getEventPublicDescription({
                      name: product.name,
                      about: product.about,
                      description: product.description,
                      lineup: product.lineup,
                    })}
                  </p>
                  {priceLabel ? <p className="product-card__price">{priceLabel}</p> : null}
                  <Link href={`/events/${product.slug}`} className="btn btn--ghost">
                    {past
                      ? 'VIEW'
                      : getPublicEventCtaLabel({
                          isFreeEntry: Boolean(product.isFreeEntry),
                          hasFreeTicketAccess: showInvitationPrice,
                          ticketsRemaining: product.ticketsRemaining,
                        })}
                  </Link>
                </article>
              );
            })}
          </div>
          <EventsPagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </SiteChrome>
  );
}
