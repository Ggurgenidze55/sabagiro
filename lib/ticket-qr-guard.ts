import type { TicketQrContext } from '@/lib/ticket-qr-access';
import { canAccessTicketQr, isQrExpired } from '@/lib/ticket-qr-access';

export function assertTicketQrAccess(ticket: TicketQrContext, adminBypass = false) {
  if (ticket.status === 'CANCELLED') {
    throw new Error('TICKET_CANCELLED');
  }
  if (isQrExpired(ticket, Date.now(), adminBypass)) {
    throw new Error('QR_EXPIRED');
  }
}

export { canAccessTicketQr, isQrExpired };
