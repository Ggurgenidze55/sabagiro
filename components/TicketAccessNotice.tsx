import Link from 'next/link';
import { getTicketAccessNotice, type TicketAccessUser } from '@/lib/ticket-access';

type TicketAccessNoticeProps = {
  user: TicketAccessUser;
  className?: string;
};

export function TicketAccessNotice({ user, className }: TicketAccessNoticeProps) {
  const notice = getTicketAccessNotice(user);
  if (!notice) return null;

  return (
    <div className={['ticket-access-notice', className].filter(Boolean).join(' ')}>
      <p className="ticket-access-notice__message">{notice.message}</p>
      {notice.hint ? <p className="ticket-access-notice__hint">{notice.hint}</p> : null}
      <div className="ticket-access-notice__actions">
        <Link href={notice.primaryHref} className="btn btn--ghost">
          {notice.primaryLabel}
        </Link>
        {notice.secondaryHref && notice.secondaryLabel ? (
          <Link href={notice.secondaryHref} className="btn btn--ghost">
            {notice.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
