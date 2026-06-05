import type { TicketSource, TicketStatus } from '@/generated/prisma/client';
import { formatScannedAt } from '@/lib/ticket-scan';

export type AdminUserTicketRow = {
  id: string;
  productName: string;
  productSlug: string;
  status: TicketStatus;
  scannedAt: string | null;
  source: TicketSource;
  tierLabel: string;
  priceGel: number;
  eventDate: string | null;
  qrToken: string;
  createdAt: string;
};

export function ticketSourceLabel(source: TicketSource) {
  switch (source) {
    case 'FREE':
      return 'Free';
    case 'ADMIN':
      return 'Admin';
    default:
      return 'Purchase';
  }
}

export function adminTicketStatusDisplay(ticket: Pick<AdminUserTicketRow, 'status' | 'scannedAt'>) {
  if (ticket.status === 'CANCELLED') {
    return {
      label: 'Cancelled',
      detail: 'Not valid for entry',
      tone: 'cancelled' as const,
    };
  }
  if (ticket.status === 'USED') {
    const when = ticket.scannedAt ? formatScannedAt(new Date(ticket.scannedAt)) : null;
    return {
      label: 'Used',
      detail: when ? `Scanned ${when}` : 'Scanned at door',
      tone: 'used' as const,
    };
  }
  return {
    label: 'Not scanned',
    detail: 'Valid · unused',
    tone: 'valid' as const,
  };
}
