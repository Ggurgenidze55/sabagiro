import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Ticket } from '@prisma/client';
import { PKPass } from 'passkit-generator';
import sharp from 'sharp';
import { getAppleWalletConfig } from '@/lib/wallet/apple-config';
import { scanUrl } from '@/lib/qr';
import { siteUrl } from '@/lib/site-url';

const PASS_MODEL = join(process.cwd(), 'wallet/apple/SabagiroTicket.pass');
const LOGO_PNG = join(process.cwd(), 'public/club/sabagiro-logo.png');

async function walletIcons() {
  const png = await readFile(LOGO_PNG);
  const [icon, icon2x, logo, logo2x] = await Promise.all([
    sharp(png).resize(29, 29, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(png).resize(58, 58, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(png).resize(160, 50, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    sharp(png).resize(320, 100, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
  ]);
  return { icon, icon2x, logo, logo2x };
}

function formatEventDate(value: string | Date | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : undefined;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tbilisi',
  }).format(date);
}

export async function buildAppleWalletPass(ticket: Ticket): Promise<Buffer> {
  const { passTypeIdentifier, teamIdentifier, certificates } = getAppleWalletConfig();
  const icons = await walletIcons();
  const holder = `${ticket.holderFirstName} ${ticket.holderLastName}`.trim();
  const scanLink = scanUrl(ticket.qrToken);
  const eventDate = formatEventDate(ticket.eventDate);

  const pass = await PKPass.from(
    {
      model: PASS_MODEL,
      certificates,
    },
    {
      serialNumber: ticket.id,
      passTypeIdentifier,
      teamIdentifier,
      organizationName: 'Sabagiro',
      description: `Sabagiro — ${ticket.productName}`,
      logoText: 'SABAGIRO',
    },
  );

  pass.addBuffer('icon.png', icons.icon);
  pass.addBuffer('icon@2x.png', icons.icon2x);
  pass.addBuffer('logo.png', icons.logo);
  pass.addBuffer('logo@2x.png', icons.logo2x);

  pass.type = 'eventTicket';

  pass.headerFields.push({
    key: 'status',
    label: 'STATUS',
    value: ticket.status,
  });

  pass.primaryFields.push({
    key: 'event',
    label: 'EVENT',
    value: ticket.productName,
  });

  pass.secondaryFields.push({
    key: 'holder',
    label: 'HOLDER',
    value: holder,
  });

  if (eventDate) {
    pass.auxiliaryFields.push({
      key: 'date',
      label: 'DATE',
      value: eventDate,
    });
  }

  if (ticket.tierLabel) {
    pass.auxiliaryFields.push({
      key: 'tier',
      label: 'TIER',
      value: ticket.tierLabel,
    });
  }

  pass.backFields.push(
    {
      key: 'id',
      label: 'Personal ID',
      value: ticket.holderPersonalId,
    },
    {
      key: 'email',
      label: 'Email',
      value: ticket.holderEmail,
    },
    {
      key: 'scan',
      label: 'Scan link',
      value: scanLink,
    },
    {
      key: 'account',
      label: 'Your account',
      value: siteUrl('/account'),
    },
  );

  pass.setBarcodes({
    message: scanLink,
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
    altText: ticket.qrToken.slice(0, 8).toUpperCase(),
  });

  return pass.getAsBuffer();
}
