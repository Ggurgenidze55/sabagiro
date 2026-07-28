import { importPKCS8, SignJWT } from 'jose';
import type { Ticket } from '@/generated/prisma/client';
import { getGoogleWalletConfig } from '@/lib/wallet/google-config';
import { scanUrl } from '@/lib/qr';
import { getSiteBaseUrl, siteUrl } from '@/lib/site-url';

const LOGO_URL = () => siteUrl('/club/sabagiro-logo.png');

function walletOrigins(): string[] {
  const host = new URL(getSiteBaseUrl()).hostname.toLowerCase();
  const roots = new Set<string>([host]);
  if (host.startsWith('www.')) {
    roots.add(host.slice(4));
  } else if (host.includes('.')) {
    roots.add(`www.${host}`);
  }
  return [...roots];
}

function googleObjectState(status: Ticket['status']): string {
  switch (status) {
    case 'USED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'EXPIRED';
    default:
      return 'ACTIVE';
  }
}

function formatEventIso(value: string | Date | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export async function buildGoogleWalletSaveUrl(ticket: Ticket): Promise<string> {
  const { issuerId, clientEmail, privateKey, reviewStatus, classSuffix } = getGoogleWalletConfig();
  const classId = `${issuerId}.${classSuffix}`;
  const objectId = `${issuerId}.${ticket.id}`;
  const holder = `${ticket.holderFirstName} ${ticket.holderLastName}`.trim();
  const scanLink = scanUrl(ticket.qrToken);
  const eventIso = formatEventIso(ticket.eventDate);

  const eventTicketClass = {
    id: classId,
    issuerName: 'Sabagiro',
    reviewStatus,
    eventName: {
      defaultValue: {
        language: 'en-US',
        value: ticket.productName,
      },
    },
    logo: {
      sourceUri: { uri: LOGO_URL() },
      contentDescription: {
        defaultValue: { language: 'en-US', value: 'Sabagiro' },
      },
    },
    hexBackgroundColor: ticket.status === 'USED' || ticket.status === 'CANCELLED' ? '#1c1c1c' : '#0a0a0a',
  };

  const textModules: Array<{ header: string; body: string; id: string }> = [
    { header: 'HOLDER', body: holder, id: 'holder' },
    { header: 'STATUS', body: ticket.status, id: 'status' },
  ];
  if (ticket.tierLabel) {
    textModules.push({ header: 'TIER', body: ticket.tierLabel, id: 'tier' });
  }

  const eventTicketObject: Record<string, unknown> = {
    id: objectId,
    classId,
    state: googleObjectState(ticket.status),
    ticketHolderName: holder,
    ticketNumber: ticket.id.slice(-8).toUpperCase(),
    barcode: {
      type: 'QR_CODE',
      value: scanLink,
      alternateText: ticket.status === 'USED' ? 'USED' : ticket.qrToken.slice(0, 8).toUpperCase(),
    },
    textModulesData: textModules,
    linksModuleData: {
      uris: [
        {
          uri: siteUrl('/account'),
          description: 'Sabagiro account',
          id: 'account',
        },
        {
          uri: scanLink,
          description: 'Door scan link',
          id: 'scan',
        },
      ],
    },
  };

  if (eventIso) {
    eventTicketObject.dateTime = {
      start: eventIso,
    };
  }

  const signingKey = await importPKCS8(privateKey, 'RS256');
  const token = await new SignJWT({
    typ: 'savetowallet',
    origins: walletOrigins(),
    payload: {
      eventTicketClasses: [eventTicketClass],
      eventTicketObjects: [eventTicketObject],
    },
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientEmail)
    .setAudience('google')
    .sign(signingKey);

  return `https://pay.google.com/gp/v/save/${token}`;
}
