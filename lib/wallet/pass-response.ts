import type { Ticket } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { buildAppleWalletPass } from '@/lib/wallet/apple-pass';
import { walletPassUpdatedTag } from '@/lib/wallet/pass-auth';

export async function walletPassResponse(ticket: Ticket, ifModifiedSince: string | null) {
  const auth = await prisma.walletPassAuth.findUnique({ where: { ticketId: ticket.id } });
  const updatedAt = auth?.updatedAt ?? ticket.createdAt;
  const tag = walletPassUpdatedTag(updatedAt);

  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    const updated = updatedAt.getTime();
    if (!Number.isNaN(since) && updated <= since) {
      return new Response(null, { status: 304 });
    }
  }

  const buffer = await buildAppleWalletPass(ticket);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': tag,
      'Cache-Control': 'no-store',
    },
  });
}
