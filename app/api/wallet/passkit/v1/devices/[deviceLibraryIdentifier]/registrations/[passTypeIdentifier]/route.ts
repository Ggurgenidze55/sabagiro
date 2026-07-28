import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { walletPassUpdatedTag } from '@/lib/wallet/pass-auth';
import { passkitPassTypeId } from '@/lib/wallet/passkit-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = {
  params: {
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  if (params.passTypeIdentifier !== passkitPassTypeId()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const passesUpdatedSince = new URL(request.url).searchParams.get('passesUpdatedSince');
  const sinceMs = passesUpdatedSince ? Date.parse(passesUpdatedSince) : 0;

  const registrations = await prisma.walletPassRegistration.findMany({
    where: {
      deviceLibraryIdentifier: params.deviceLibraryIdentifier,
      passTypeIdentifier: params.passTypeIdentifier,
    },
    select: { serialNumber: true, ticketId: true },
  });

  if (registrations.length === 0) {
    return new Response(null, { status: 204 });
  }

  const ticketIds = [...new Set(registrations.map((r) => r.ticketId))];
  const authRows = await prisma.walletPassAuth.findMany({
    where: { ticketId: { in: ticketIds } },
    select: { ticketId: true, updatedAt: true },
  });
  const updatedByTicket = new Map(authRows.map((a) => [a.ticketId, a.updatedAt]));

  const serialNumbers = registrations
    .filter((r) => {
      const updatedAt = updatedByTicket.get(r.ticketId);
      if (!updatedAt) return false;
      if (!passesUpdatedSince || Number.isNaN(sinceMs)) return true;
      return updatedAt.getTime() > sinceMs;
    })
    .map((r) => r.serialNumber);

  if (serialNumbers.length === 0) {
    return new Response(null, { status: 204 });
  }

  const latest = authRows.reduce(
    (max, row) => (row.updatedAt > max ? row.updatedAt : max),
    authRows[0]?.updatedAt ?? new Date(0),
  );

  return NextResponse.json(
    { serialNumbers, lastUpdated: walletPassUpdatedTag(latest) },
    { status: 200 },
  );
}
