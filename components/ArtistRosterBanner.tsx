import { artistDisplayName } from '@/lib/artist-tickets';

type Props = {
  stageName: string;
  firstName: string;
  lastName: string;
  weeklyTickets: boolean;
  active: boolean;
};

export function ArtistRosterBanner({
  stageName,
  firstName,
  lastName,
  weeklyTickets,
  active,
}: Props) {
  const displayName = artistDisplayName({ stageName, firstName, lastName });

  return (
    <div className="artist-roster-banner" style={{ marginBottom: '1.5rem' }}>
      <p className="artist-roster-banner__title">DJ / Artist roster</p>
      <p className="page-lead" style={{ marginBottom: '0.35rem' }}>
        You are on the Sabagiro artist roster as <strong>{displayName}</strong>.
      </p>
      {!active ? (
        <p className="page-lead">Your roster profile is currently inactive — contact Sabagiro.</p>
      ) : weeklyTickets ? (
        <p className="page-lead">
          Complimentary QR tickets for upcoming events are emailed every{' '}
          <strong>Thursday at 20:00</strong> (Tbilisi). They also appear below.
        </p>
      ) : (
        <p className="page-lead">Weekly auto-tickets are off — contact Sabagiro for event access.</p>
      )}
    </div>
  );
}

export function ArtistUserBadge() {
  return <span className="artist-user-badge">DJ</span>;
}
