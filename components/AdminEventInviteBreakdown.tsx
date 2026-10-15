type AdminEventInviteBreakdownProps = {
  admin: number;
  free: number;
  artist: number;
};

export function AdminEventInviteBreakdown({ admin, free, artist }: AdminEventInviteBreakdownProps) {
  const total = admin + free + artist;
  if (total === 0) return null;

  return (
    <section className="admin-ticket-stats admin-invite-breakdown" aria-label="Invitation breakdown">
      <h2 className="admin-section-title">Invitations by source</h2>
      <dl className="admin-ticket-stats__dl admin-invite-breakdown__dl">
        <div>
          <dt>Admin guest invites</dt>
          <dd>{admin}</dd>
        </div>
        <div>
          <dt>Member invitations (FREE)</dt>
          <dd>{free}</dd>
        </div>
        <div>
          <dt>DJ / artist comps</dt>
          <dd>{artist}</dd>
        </div>
        <div>
          <dt>Total invitations</dt>
          <dd className="admin-ticket-stats__accent">{total}</dd>
        </div>
      </dl>
    </section>
  );
}
