import path from 'node:path';
import sharp from 'sharp';
import { qrPngBuffer } from '@/lib/qr';

const W = 720;
const PAD = 40;
const QR_SIZE = 320;
const ACID = '#f9c108';
const BG = '#0a0a0a';
const MUTED = '#8a827a';
const TEXT = '#e8e0d8';

export type TicketPassEventInfo = {
  title?: string | null;
  dayLabel?: string | null;
  dateLabel?: string | null;
  doorsOpen?: string | null;
  lineup?: string | null;
  tag?: string | null;
  about?: string | null;
  coordsLabel?: string | null;
};

export type TicketPassInput = {
  qrToken: string;
  productName: string;
  holderFirstName: string;
  holderLastName: string;
  holderPersonalId: string;
  priceGel: number;
  tierLabel?: string | null;
  event?: TicketPassEventInfo | null;
};

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapWords(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

type TextLine = { text: string; size: number; color: string; weight?: number; tracking?: number };

function buildLines(input: TicketPassInput): TextLine[] {
  const event = input.event;
  const title = (event?.title || input.productName).trim() || 'Sabagiro';
  const when = [event?.dayLabel, event?.dateLabel].filter(Boolean).join(' · ');
  const doors = event?.doorsOpen?.trim() || '';
  const lineup = event?.lineup?.trim() || '';
  const tag = event?.tag?.trim() || '';
  const about = event?.about?.trim() ? truncate(event.about.trim(), 220) : '';
  const coords = event?.coordsLabel?.trim() || '';
  const holder = `${input.holderFirstName} ${input.holderLastName}`.trim();
  const tier = input.tierLabel?.trim() ? ` · ${input.tierLabel.trim()}` : '';
  const priceLine = `${input.priceGel} GEL${tier}`;

  const lines: TextLine[] = [
    { text: 'SABAGIRO', size: 22, color: ACID, weight: 700, tracking: 8 },
    { text: 'TICKET', size: 13, color: MUTED, tracking: 6 },
    { text: '', size: 16, color: TEXT },
  ];

  for (const part of wrapWords(title.toUpperCase(), 28)) {
    lines.push({ text: part, size: 28, color: ACID, weight: 700, tracking: 2 });
  }
  lines.push({ text: '', size: 14, color: TEXT });

  if (when) {
    lines.push({ text: 'WHEN', size: 11, color: ACID, tracking: 4 });
    lines.push({ text: when.toUpperCase(), size: 16, color: TEXT });
  }
  if (doors) {
    lines.push({ text: 'DOORS', size: 11, color: ACID, tracking: 4 });
    lines.push({ text: doors, size: 16, color: TEXT });
  }
  if (lineup) {
    lines.push({ text: 'LINEUP', size: 11, color: ACID, tracking: 4 });
    for (const part of wrapWords(lineup.toUpperCase(), 34)) {
      lines.push({ text: part, size: 15, color: TEXT });
    }
  }
  if (tag) {
    lines.push({ text: 'NOTE', size: 11, color: ACID, tracking: 4 });
    for (const part of wrapWords(tag.toUpperCase(), 34)) {
      lines.push({ text: part, size: 15, color: TEXT });
    }
  }
  if (about) {
    lines.push({ text: 'ABOUT', size: 11, color: ACID, tracking: 4 });
    for (const part of wrapWords(about, 36)) {
      lines.push({ text: part, size: 14, color: MUTED });
    }
  }

  lines.push({ text: 'LOCATION', size: 11, color: ACID, tracking: 4 });
  lines.push({ text: 'SABAGIRO · TBILISI', size: 15, color: TEXT });
  if (coords) {
    lines.push({ text: coords.toUpperCase(), size: 13, color: MUTED });
  }

  lines.push({ text: '', size: 20, color: TEXT });
  lines.push({ text: '__QR__', size: QR_SIZE + 24, color: TEXT });
  lines.push({ text: '', size: 18, color: TEXT });

  lines.push({ text: holder.toUpperCase(), size: 18, color: ACID, weight: 700 });
  lines.push({ text: `ID ${input.holderPersonalId}`, size: 15, color: TEXT });
  lines.push({ text: priceLine.toUpperCase(), size: 15, color: TEXT });
  lines.push({ text: '', size: 12, color: TEXT });
  lines.push({ text: 'SHOW THIS QR AT THE DOOR', size: 12, color: MUTED, tracking: 3 });

  return lines;
}

/** Full ticket card PNG: event details + QR (for download / email attachment). */
export async function ticketPassPngBuffer(input: TicketPassInput): Promise<Buffer> {
  const lines = buildLines(input);
  let y = PAD + 8;
  const textSpans: string[] = [];
  let qrTop = 0;

  for (const line of lines) {
    if (line.text === '__QR__') {
      qrTop = y + 12;
      y += line.size;
      continue;
    }
    if (!line.text) {
      y += line.size;
      continue;
    }
    const tracking = line.tracking != null ? ` letter-spacing="${line.tracking * 0.05}em"` : '';
    const weight = line.weight ? ` font-weight="${line.weight}"` : '';
    textSpans.push(
      `<text x="${PAD}" y="${y + line.size}" fill="${line.color}" font-size="${line.size}"${weight}${tracking} font-family="SabagiroPass, Arial, Helvetica, sans-serif">${esc(line.text)}</text>`,
    );
    y += line.size + (line.size > 20 ? 10 : 8);
  }

  const height = Math.max(y + PAD, qrTop + QR_SIZE + 200);
  const fontPath = path.join(process.cwd(), 'public/fonts/BankGothic-Md.ttf');
  const fontUrl = `file://${fontPath.split(path.sep).join('/')}`;
  const qrLeft = Math.round((W - QR_SIZE) / 2);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'SabagiroPass';
        src: url('${esc(fontUrl)}');
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect x="20" y="20" width="${W - 40}" height="${height - 40}" fill="none" stroke="${ACID}" stroke-width="2"/>
  ${textSpans.join('\n  ')}
  <rect x="${qrLeft - 8}" y="${qrTop - 8}" width="${QR_SIZE + 16}" height="${QR_SIZE + 16}" fill="#ffffff" stroke="${ACID}" stroke-width="4"/>
</svg>`;

  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const qr = await sharp(await qrPngBuffer(input.qrToken))
    .resize(QR_SIZE, QR_SIZE, { fit: 'fill' })
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: qr, left: qrLeft, top: qrTop }])
    .png()
    .toBuffer();
}

export async function ticketPassPngBase64(input: TicketPassInput): Promise<string> {
  const buf = await ticketPassPngBuffer(input);
  return buf.toString('base64');
}
