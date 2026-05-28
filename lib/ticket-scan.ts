import type { TicketStatus } from '@prisma/client';

export type ScanVerdict = {
  tone: 'ok' | 'warn' | 'bad';
  title: string;
  titleKa: string;
  subtitle: string;
  subtitleKa: string;
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

export function getScanVerdict(status: TicketStatus, scannedAt: Date | null): ScanVerdict {
  if (status === 'CANCELLED') {
    return {
      tone: 'bad',
      title: 'TICKET CANCELLED',
      titleKa: 'ბილეთი გაუქმებულია',
      subtitle: 'Do not admit · Invalid ticket',
      subtitleKa: 'არ ჩაუშვა · ბილეთი არ მოქმედებს',
      admit: false,
    };
  }

  if (status === 'USED') {
    const when = formatScannedAt(scannedAt);
    return {
      tone: 'bad',
      title: 'ALREADY SCANNED',
      titleKa: 'უკვე დასკანერებულია',
      subtitle: when
        ? `Scanned at ${when} · Do not admit again`
        : 'This ticket was already used · Do not admit again',
      subtitleKa: when
        ? `სკანირებულია: ${when} · ხელახალი გავლა აკრძალულია`
        : 'ბილეთი უკვე გამოყენებულია · ხელახალი გავლა აკრძალულია',
      admit: false,
    };
  }

  return {
    tone: 'ok',
    title: 'VALID · NOT SCANNED YET',
    titleKa: 'ვალიდურია · ჯერ არ არის დასკანერებული',
    subtitle: 'OK to admit · Confirm scan at the door',
    subtitleKa: 'შეიძლება ჩაშვა · დარწმუნდი სკანერით',
    admit: true,
  };
}
