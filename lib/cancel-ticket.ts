import { prisma } from '@/lib/db';
import { notifyWalletPassUpdate } from '@/lib/wallet/notify-pass-update';

/**
 * Mark a ticket CANCELLED after a Flitt refund (or other void).
 * Door scan / QR / wallet will reject it; purchase limits free the slot.
 */
export async function cancelTicketById(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('TICKET_NOT_FOUND');
  if (ticket.status === 'CANCELLED') {
    return { ticket, alreadyCancelled: true as const };
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'CANCELLED' },
  });

  notifyWalletPassUpdate(updated.id).catch((err) => {
    console.error('[wallet] pass update notify failed after cancel', err);
  });

  return { ticket: updated, alreadyCancelled: false as const };
}
