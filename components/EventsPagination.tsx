import Link from 'next/link';

type EventsPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
};

export function EventsPagination({ page, totalPages, total }: EventsPaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref = page <= 2 ? '/events' : `/events?page=${page - 1}`;
  const nextHref = `/events?page=${page + 1}`;

  return (
    <nav className="events-pagination" aria-label="Events pages">
      {page > 1 ? (
        <Link href={prevHref} className="btn btn--ghost">
          Previous
        </Link>
      ) : (
        <span className="btn btn--ghost events-pagination__disabled" aria-hidden>
          Previous
        </span>
      )}
      <span className="events-pagination__info">
        Page {page} of {totalPages} · {total} events
      </span>
      {page < totalPages ? (
        <Link href={nextHref} className="btn btn--ghost">
          Next
        </Link>
      ) : (
        <span className="btn btn--ghost events-pagination__disabled" aria-hidden>
          Next
        </span>
      )}
    </nav>
  );
}
