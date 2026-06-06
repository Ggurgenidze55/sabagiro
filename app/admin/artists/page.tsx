import { AdminArtistsPanel } from '@/components/AdminArtistsPanel';
import { artistDisplayName } from '@/lib/artist-tickets';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Artists — Admin — Sabagiro' };

export default async function AdminArtistsPage() {
  const rows = await prisma.artist.findMany({
    orderBy: [{ stageName: 'asc' }, { lastName: 'asc' }],
    include: { _count: { select: { dispatches: true } } },
  });

  const artists = rows.map((a) => ({
    id: a.id,
    stageName: a.stageName,
    displayName: artistDisplayName(a),
    firstName: a.firstName,
    lastName: a.lastName,
    personalId: a.personalId,
    email: a.email,
    phone: a.phone,
    instagramUrl: a.instagramUrl,
    active: a.active,
    weeklyTickets: a.weeklyTickets,
    dispatchCount: a._count.dispatches,
  }));

  return (
    <>
      <h1 className="page-title">ARTISTS</h1>
      <AdminArtistsPanel artists={artists} />
    </>
  );
}
