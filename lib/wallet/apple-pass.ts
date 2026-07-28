import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Ticket } from '@/generated/prisma/client';
import { PKPass } from 'passkit-generator';
import { formatScannedAt } from '@/lib/ticket-scan';
import { getAppleWalletConfig } from '@/lib/wallet/apple-config';
import { getOrCreateWalletPassAuth, walletPassWebServiceUrl } from '@/lib/wallet/pass-auth';
import { scanUrl } from '@/lib/qr';
import { siteUrl } from '@/lib/site-url';

const PASS_MODEL = join(process.cwd(), 'wallet/apple/ticket-template.pass');
const ICON_DIR = join(process.cwd(), 'wallet/apple/icons');

async function walletIcons() {
  const [icon, icon2x, logo, logo2x] = await Promise.all([
    readFile(join(ICON_DIR, 'icon.png')),
    readFile(join(ICON_DIR, 'icon@2x.png')),
    readFile(join(ICON_DIR, 'logo.png')),
    readFile(join(ICON_DIR, 'logo@2x.png')),
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

function statusLabel(status: Ticket['status']): string {
  switch (status) {
    case 'USED':
      return 'USED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'VALID';
  }
}

export async function buildAppleWalletPass(ticket: Ticket): Promise<Buffer> {
  const { passTypeIdentifier, teamIdentifier, certificates } = getAppleWalletConfig();
  const auth = await getOrCreateWalletPassAuth(ticket.id);
  const icons = await walletIcons();
  const holder = `${ticket.holderFirstName} ${ticket.holderLastName}`.trim();
  const scanLink = scanUrl(ticket.qrToken);
  const eventDate = formatEventDate(ticket.eventDate);
  const used = ticket.status === 'USED';
  const cancelled = ticket.status === 'CANCELLED';

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
      webServiceURL: walletPassWebServiceUrl(),
      authenticationToken: auth.authenticationToken,
      backgroundColor: used || cancelled ? 'rgb(28, 28, 28)' : 'rgb(10, 10, 10)',
      foregroundColor: used || cancelled ? 'rgb(136, 136, 136)' : 'rgb(242, 235, 227)',
      labelColor: used || cancelled ? 'rgb(136, 136, 136)' : 'rgb(249, 193, 8)',
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
    value: statusLabel(ticket.status),
    changeMessage: used ? 'Ticket scanned — %@' : cancelled ? 'Ticket cancelled — %@' : undefined,
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

  if (used && ticket.scannedAt) {
    pass.backFields.push({
      key: 'scanned',
      label: 'Scanned at',
      value: formatScannedAt(ticket.scannedAt) ?? ticket.scannedAt.toISOString(),
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

  if (!cancelled) {
    pass.setBarcodes({
      message: scanLink,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: used ? 'USED' : ticket.qrToken.slice(0, 8).toUpperCase(),
    });
  }

  return pass.getAsBuffer();
}
