import { artistDisplayName } from '@/lib/artist-display';

type Props = {
  stageName: string;
  firstName: string;
  lastName: string;
  weeklyTickets: boolean;
  active: boolean;
};

export function ArtistListBanner({
  stageName,
  firstName,
  lastName,
  weeklyTickets,
  active,
}: Props) {
  const displayName = artistDisplayName({ stageName, firstName, lastName });

  return (
    <div className="artist-list-banner" style={{ marginBottom: '1.5rem' }}>
      <p className="artist-list-banner__title">DJ / Artist list</p>
      <p className="page-lead" style={{ marginBottom: '0.35rem' }}>
        You are on the Sabagiro artist list as <strong>{displayName}</strong>.
      </p>
      {!active ? (
        <p className="page-lead">Your artist list profile is currently inactive — contact Sabagiro.</p>
      ) : weeklyTickets ? (
        <p className="page-lead">
          Complimentary QR tickets are emailed{' '}
          <strong>one day before each event</strong> (when that event has DJ tickets enabled). They
          also appear below.
        </p>
      ) : (
        <p className="page-lead">Weekly auto-tickets are off — contact Sabagiro for event access.</p>
      )}
    </div>
  );
}
