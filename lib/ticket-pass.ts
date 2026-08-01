import { readFileSync } from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { qrPngBuffer } from '@/lib/qr';

const W = 720;
const PAD = 40;
const QR_SIZE = 320;
const ACID = '#f9c108';
const BG = '#0a0a0a';
const MUTED = '#8a827a';
const TEXT = '#e8e0d8';

/** Bebas Neue — glyphs converted to SVG paths so PNG needs no runtime font. */
const PASS_FONT_FILE = 'BebasNeue-Regular.ttf';

let cachedFont: opentype.Font | null = null;

function getPassFont(): opentype.Font {
  if (cachedFont) return cachedFont;
  const fontPath = path.join(process.cwd(), 'public/fonts', PASS_FONT_FILE);
  const raw = readFileSync(fontPath);
  cachedFont = opentype.parse(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  );
  return cachedFont;
}

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

function passText(value: string) {
  return value
    .replace(/°/g, '')
    .replace(/[·•]/g, ' | ')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function measureWidth(text: string, size: number, tracking = 0): number {
  const font = getPassFont();
  if (!tracking) return font.getAdvanceWidth(text, size);
  let w = 0;
  for (const ch of text) {
    w += font.getAdvanceWidth(ch, size) + tracking;
  }
  return w;
}

function wrapWords(text: string, size: number, tracking = 0, maxWidth = W - PAD * 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && measureWidth(next, size, tracking) > maxWidth) {
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
  return `${t.slice(0, max - 1).trimEnd()}...`;
}

/** Render text as SVG path data (font baked into geometry). */
function textToPath(text: string, x: number, y: number, size: number, fill: string, tracking = 0): string {
  const font = getPassFont();
  if (!text) return '';

  if (tracking <= 0) {
    const p = font.getPath(text, x, y, size);
    const d = p.toPathData(2);
    return d ? `<path d="${d}" fill="${fill}"/>` : '';
  }

  let cx = x;
  const parts: string[] = [];
  for (const ch of text) {
    const p = font.getPath(ch, cx, y, size);
    const d = p.toPathData(2);
    if (d) parts.push(d);
    cx += font.getAdvanceWidth(ch, size) + tracking;
  }
  return parts.length ? `<path d="${parts.join(' ')}" fill="${fill}"/>` : '';
}

type TextLine = { text: string; size: number; color: string; tracking?: number };

function buildLines(input: TicketPassInput): TextLine[] {
  const event = input.event;
  const title = passText(event?.title || input.productName || 'Sabagiro');
  const when = passText([event?.dayLabel, event?.dateLabel].filter(Boolean).join(' · '));
  const doors = passText(event?.doorsOpen || '');
  const lineup = passText(event?.lineup || '');
  const tag = passText(event?.tag || '');
  const about = event?.about?.trim() ? passText(truncate(event.about.trim(), 220)) : '';
  const coords = passText(event?.coordsLabel || '');
  const holder = passText(`${input.holderFirstName} ${input.holderLastName}`);
  const tier = input.tierLabel?.trim() ? ` | ${passText(input.tierLabel)}` : '';
  const priceLine = `${input.priceGel} GEL${tier}`;

  const lines: TextLine[] = [
    { text: 'SABAGIRO', size: 28, color: ACID, tracking: 4 },
    { text: 'TICKET', size: 16, color: MUTED, tracking: 3 },
    { text: '', size: 16, color: TEXT },
  ];

  for (const part of wrapWords(title.toUpperCase(), 34, 2)) {
    lines.push({ text: part, size: 34, color: ACID, tracking: 2 });
  }
  lines.push({ text: '', size: 14, color: TEXT });

  if (when) {
    lines.push({ text: 'WHEN', size: 13, color: ACID, tracking: 3 });
    for (const part of wrapWords(when.toUpperCase(), 20)) {
      lines.push({ text: part, size: 20, color: TEXT });
    }
  }
  if (doors) {
    lines.push({ text: 'DOORS', size: 13, color: ACID, tracking: 3 });
    lines.push({ text: doors, size: 20, color: TEXT });
  }
  if (lineup) {
    lines.push({ text: 'LINEUP', size: 13, color: ACID, tracking: 3 });
    for (const part of wrapWords(lineup.toUpperCase(), 18)) {
      lines.push({ text: part, size: 18, color: TEXT });
    }
  }
  if (tag) {
    lines.push({ text: 'NOTE', size: 13, color: ACID, tracking: 3 });
    for (const part of wrapWords(tag.toUpperCase(), 18)) {
      lines.push({ text: part, size: 18, color: TEXT });
    }
  }
  if (about) {
    lines.push({ text: 'ABOUT', size: 13, color: ACID, tracking: 3 });
    for (const part of wrapWords(about.toUpperCase(), 16)) {
      lines.push({ text: part, size: 16, color: MUTED });
    }
  }

  lines.push({ text: 'LOCATION', size: 13, color: ACID, tracking: 3 });
  lines.push({ text: 'SABAGIRO | TBILISI', size: 18, color: TEXT });
  if (coords) {
    lines.push({ text: coords.toUpperCase(), size: 16, color: MUTED });
  }

  lines.push({ text: '', size: 20, color: TEXT });
  lines.push({ text: '__QR__', size: QR_SIZE + 24, color: TEXT });
  lines.push({ text: '', size: 18, color: TEXT });

  for (const part of wrapWords(holder.toUpperCase(), 22)) {
    lines.push({ text: part, size: 22, color: ACID });
  }
  lines.push({ text: `ID ${input.holderPersonalId}`, size: 18, color: TEXT });
  for (const part of wrapWords(priceLine.toUpperCase(), 18)) {
    lines.push({ text: part, size: 18, color: TEXT });
  }
  lines.push({ text: '', size: 12, color: TEXT });
  for (const part of wrapWords('SHOW THIS QR AT THE DOOR', 14, 2)) {
    lines.push({ text: part, size: 14, color: MUTED, tracking: 2 });
  }

  return lines;
}

/** Full ticket card PNG: event details + QR (for download / email attachment). */
export async function ticketPassPngBuffer(input: TicketPassInput): Promise<Buffer> {
  const lines = buildLines(input);
  let y = PAD + 8;
  const pathSpans: string[] = [];
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
    // SVG text baseline ≈ y + size; opentype uses baseline the same way
    pathSpans.push(textToPath(line.text, PAD, y + line.size, line.size, line.color, line.tracking ?? 0));
    y += line.size + (line.size > 24 ? 10 : 8);
  }

  const height = Math.max(y + PAD, qrTop + QR_SIZE + 200);
  const qrLeft = Math.round((W - QR_SIZE) / 2);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect x="20" y="20" width="${W - 40}" height="${height - 40}" fill="none" stroke="${ACID}" stroke-width="2"/>
  ${pathSpans.filter(Boolean).join('\n  ')}
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
