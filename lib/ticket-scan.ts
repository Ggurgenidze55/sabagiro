import type { TicketStatus } from '@/generated/prisma/client';

export type ScanVerdict = {
  tone: 'ok' | 'warn' | 'bad';
  title: string;
  subtitle: string;
  admit: boolean;
};

export function formatScannedAt(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tbilisi',
  }).format(date);
}

export function getScanVerdict(
  status: TicketStatus,
  scannedAt: Date | null,
  qrExpired = false,
): ScanVerdict {
  if (qrExpired && status === 'VALID') {
    return {
      tone: 'bad',
      title: 'EVENT ENDED',
      subtitle: 'QR expired · Do not admit',
      admit: false,
    };
  }

  if (status === 'CANCELLED') {
    return {
      tone: 'bad',
      title: 'TICKET CANCELLED',
      subtitle: 'Do not admit · Invalid ticket',
      admit: false,
    };
  }

  if (status === 'USED') {
    const when = formatScannedAt(scannedAt);
    return {
      tone: 'bad',
      title: 'ALREADY SCANNED',
      subtitle: when
        ? `Scanned at ${when} · Do not admit again`
        : 'This ticket was already used · Do not admit again',
      admit: false,
    };
  }

  return {
    tone: 'ok',
    title: 'VALID · NOT SCANNED YET',
    subtitle: 'OK to admit · Confirm scan at the door',
    admit: true,
  };
}
