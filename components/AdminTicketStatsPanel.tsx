import type { AdminTicketStats, TicketKindStats } from '@/lib/admin-ticket-stats';

function KindBlock({
  title,
  stats,
  hint,
}: {
  title: string;
  stats: TicketKindStats;
  hint?: string;
}) {
  const active = stats.used + stats.unused;

  return (
    <div className="admin-ticket-stats__block">
      <h3 className="admin-ticket-stats__block-title">{title}</h3>
      {hint ? <p className="admin-ticket-stats__hint">{hint}</p> : null}
      <dl className="admin-ticket-stats__dl">
        <div>
          <dt>Total issued</dt>
          <dd>{stats.total}</dd>
        </div>
        <div>
          <dt>Scanned at door</dt>
          <dd className="admin-ticket-stats__accent">{stats.used}</dd>
        </div>
        <div>
          <dt>Not scanned yet</dt>
          <dd>{stats.unused}</dd>
        </div>
        <div>
          <dt>Active (valid + used)</dt>
          <dd>{active}</dd>
        </div>
        {stats.cancelled > 0 ? (
          <div>
            <dt>Cancelled</dt>
            <dd>{stats.cancelled}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function AdminTicketStatsPanel({ stats }: { stats: AdminTicketStats }) {
  return (
    <section className="admin-ticket-stats" aria-label="Ticket statistics">
      <h2 className="admin-section-title">Ticket statistics</h2>
      <p className="admin-ticket-stats__lead">
        Scanned = marked USED at the door · Not scanned = still VALID · Invitations = free
        (admin invites, account invitations, artist comps) · Paid = checkout purchases
      </p>

      <div className="stat-grid admin-ticket-stats__summary">
        <div className="stat-card">
          <span className="stat-card__label">Scanned (all)</span>
          <span className="stat-card__value">{stats.combined.used}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Not scanned</span>
          <span className="stat-card__value">{stats.combined.unused}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Paid · scanned</span>
          <span className="stat-card__value">{stats.paid.used}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Invites · scanned</span>
          <span className="stat-card__value">{stats.invite.used}</span>
        </div>
      </div>

      <div className="admin-ticket-stats__split">
        <KindBlock
          title="Paid tickets"
          hint="Purchased on sabagiro.ge (Flitt checkout)."
          stats={stats.paid}
        />
        <KindBlock
          title="Free invitations"
          hint="Admin Guest invites, verified invitations, DJ/artist comps."
          stats={stats.invite}
        />
      </div>
    </section>
  );
}
