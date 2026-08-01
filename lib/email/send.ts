import type { Ticket } from '@/generated/prisma/client';
import { CLUB_COORDS_LABEL, CLUB_MAPS_URL } from '@/lib/club-location';
import { sendEmail, type SendEmailResult } from '@/lib/email/client';
import type { ContactTopic } from '@/lib/contact-topic';
import { getContactInboxEmailsForTopic } from '@/lib/contact-inbox';
import { prisma } from '@/lib/db';
import {
  accountPendingEmail,
  accountRejectedEmail,
  accountVerifiedEmail,
  artistRosterAddedEmail,
  artistRosterRemovedEmail,
  doorScanDisabledEmail,
  doorScanEnabledEmail,
  freeTicketsEnabledEmail,
  staffRoleChangedEmail,
  contactFormAckEmail,
  contactFormNotificationEmail,
  passwordChangedEmail,
  passwordResetEmail,
  profileEmailChangedEmail,
  ticketPurchaseEmail,
  welcomeRegistrationEmail,
  type TicketEmailEventInfo,
} from '@/lib/email/templates';
import { TICKET_QR_CID } from '@/lib/email/theme';
import { qrPngBase64 } from '@/lib/qr';
import { siteUrl } from '@/lib/site-url';

async function loadTicketEmailEvent(productSlug: string): Promise<TicketEmailEventInfo | null> {
  const event = await prisma.clubEvent.findUnique({
    where: { slug: productSlug },
    select: {
      slug: true,
      title: true,
      about: true,
      lineup: true,
      tag: true,
      dayLabel: true,
      dateLabel: true,
      doorsOpen: true,
    },
  });
  if (!event) return null;
  return {
    title: event.title,
    dayLabel: event.dayLabel,
    dateLabel: event.dateLabel,
    doorsOpen: event.doorsOpen,
    lineup: event.lineup,
    tag: event.tag,
    about: event.about,
    eventUrl: siteUrl(`/events/${event.slug}`),
    mapsUrl: CLUB_MAPS_URL,
    coordsLabel: CLUB_COORDS_LABEL,
  };
}

export function sendWelcomeRegistrationEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = welcomeRegistrationEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendAccountVerifiedEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = accountVerifiedEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendAccountRejectedEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = accountRejectedEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendAccountPendingEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = accountPendingEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendFreeTicketsEnabledEmail(opts: {
  to: string;
  firstName: string;
  quota: number;
}): Promise<SendEmailResult> {
  const msg = freeTicketsEnabledEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export function sendDoorScanEnabledEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = doorScanEnabledEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendDoorScanDisabledEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = doorScanDisabledEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendStaffRoleChangedEmail(opts: {
  to: string;
  firstName: string;
  role: string;
  previousRole: string;
}): Promise<SendEmailResult> {
  const msg = staffRoleChangedEmail({
    firstName: opts.firstName,
    role: opts.role,
    previousRole: opts.previousRole,
  });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendArtistRosterAddedEmail(opts: {
  to: string;
  firstName: string;
  displayName: string;
  weeklyTickets: boolean;
}): Promise<SendEmailResult> {
  const msg = artistRosterAddedEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export function sendArtistRosterRemovedEmail(opts: {
  to: string;
  firstName: string;
  displayName: string;
}): Promise<SendEmailResult> {
  const msg = artistRosterRemovedEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export async function sendTicketEmail(payload: {
  to: string;
  ticket: Ticket;
  scanLink: string;
}): Promise<SendEmailResult> {
  const { ticket, scanLink, to } = payload;
  const [qrContent, event] = await Promise.all([
    qrPngBase64(ticket.qrToken),
    loadTicketEmailEvent(ticket.productSlug),
  ]);
  const qrFilename = `sabagiro-ticket-${ticket.id.slice(-8)}.png`;
  const qrDownloadUrl = siteUrl(`/api/scan/${ticket.qrToken}/qr?download=1`);
  const msg = ticketPurchaseEmail({
    ticketId: ticket.id,
    productName: ticket.productName,
    holderFirstName: ticket.holderFirstName,
    holderLastName: ticket.holderLastName,
    holderPersonalId: ticket.holderPersonalId,
    priceGel: ticket.priceGel,
    tierLabel: ticket.tierLabel,
    scanLink,
    qrCid: TICKET_QR_CID,
    qrDownloadUrl,
    event,
  });
  return sendEmail({
    to,
    ...msg,
    attachments: [
      {
        filename: qrFilename,
        content: qrContent,
        contentType: 'image/png',
        inlineContentId: TICKET_QR_CID,
      },
      {
        filename: qrFilename,
        content: qrContent,
        contentType: 'image/png',
      },
    ],
  });
}

export function sendPasswordResetEmail(opts: {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresMinutes: number;
}): Promise<SendEmailResult> {
  const msg = passwordResetEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export function sendPasswordChangedEmail(opts: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const msg = passwordChangedEmail({ firstName: opts.firstName });
  return sendEmail({ to: opts.to, ...msg });
}

export function sendProfileEmailChangedNotification(opts: {
  to: string;
  firstName: string;
  newEmail: string;
}): Promise<SendEmailResult> {
  const msg = profileEmailChangedEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export function sendContactFormNotification(opts: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}): Promise<SendEmailResult> {
  const msg = contactFormNotificationEmail(opts);
  return sendEmail({
    to: getContactInboxEmailsForTopic(opts.topic),
    replyTo: opts.email,
    ...msg,
  });
}

export function sendContactFormAck(opts: {
  to: string;
  name: string;
}): Promise<SendEmailResult> {
  const msg = contactFormAckEmail({ name: opts.name });
  return sendEmail({ to: opts.to, ...msg });
}
