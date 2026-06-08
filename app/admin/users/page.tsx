import { AdminUsersPanel } from '@/components/AdminUsersPanel';
import { artistDisplayName } from '@/lib/artist-tickets';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAssignStaffRoles, canManageUsers, isFullAdmin } from '@/lib/staff-roles';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Users — Admin' };

export default async function AdminUsersPage() {
  const actor = await getSessionUser();
  if (!actor || !canManageUsers(actor.role)) redirect('/account');

  const [users, artists] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { tickets: true } },
        tickets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            productName: true,
            productSlug: true,
            status: true,
            scannedAt: true,
            source: true,
            tierLabel: true,
            priceGel: true,
            eventDate: true,
            qrToken: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.artist.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        stageName: true,
        firstName: true,
        lastName: true,
        active: true,
      },
    }),
  ]);

  const artistByUserId = new Map(
    artists.filter((a) => a.userId).map((a) => [a.userId as string, a]),
  );
  const artistByEmail = new Map(artists.map((a) => [a.email.toLowerCase(), a]));

  function artistForUser(user: { id: string; email: string }) {
    return artistByUserId.get(user.id) ?? artistByEmail.get(user.email.toLowerCase()) ?? null;
  }

  return (
    <div className="centered-page">
      <header className="centered-page__intro">
        <h1 className="page-title">USERS</h1>
        <p className="page-lead">
          Review Facebook &amp; Instagram links, then verify users so they can buy tickets.
        </p>
      </header>
      <div className="centered-page__body admin-users-panel">
        <AdminUsersPanel
          users={users.map((u) => {
            const artist = artistForUser(u);
            return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          personalId: u.personalId,
          facebookUrl: u.facebookUrl,
          instagramUrl: u.instagramUrl,
          verificationStatus: u.verificationStatus,
          role: u.role,
          isArtist: Boolean(artist),
          artistId: artist?.id ?? null,
          artistLabel: artist ? artistDisplayName(artist) : null,
          artistActive: artist?.active ?? false,
          ticketCount: u._count.tickets,
          tickets: u.tickets.map((t) => ({
            id: t.id,
            productName: t.productName,
            productSlug: t.productSlug,
            status: t.status,
            scannedAt: t.scannedAt?.toISOString() ?? null,
            source: t.source,
            tierLabel: t.tierLabel,
            priceGel: t.priceGel,
            eventDate: t.eventDate,
            qrToken: t.qrToken,
            createdAt: t.createdAt.toISOString(),
          })),
          ticketLimitPerEvent: u.ticketLimitPerEvent,
          freeTicketsEnabled: u.freeTicketsEnabled,
          freeTicketsQuota: u.freeTicketsQuota,
          freeTicketsUsed: u.freeTicketsUsed,
          doorScanEnabled: u.doorScanEnabled,
            };
          })}
          canAssignRoles={canAssignStaffRoles(actor.role)}
          canDeleteStaff={isFullAdmin(actor.role)}
        />
      </div>
    </div>
  );
}
