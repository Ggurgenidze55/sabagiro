import type { Ticket } from '@/generated/prisma/client';
import { sendEmail, type SendEmailResult } from '@/lib/email/client';
import type { ContactTopic } from '@/lib/contact-topic';
import { getContactInboxEmailsForTopic } from '@/lib/contact-inbox';
import {
  accountPendingEmail,
  accountRejectedEmail,
  accountVerifiedEmail,
  artistRosterAddedEmail,
  doorScanDisabledEmail,
  doorScanEnabledEmail,
  freeTicketsEnabledEmail,
  contactFormAckEmail,
  contactFormNotificationEmail,
  passwordChangedEmail,
  passwordResetEmail,
  profileEmailChangedEmail,
  ticketPurchaseEmail,
  welcomeRegistrationEmail,
} from '@/lib/email/templates';
import { TICKET_QR_CID } from '@/lib/email/theme';
import { qrPngBase64 } from '@/lib/qr';

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

export function sendArtistRosterAddedEmail(opts: {
  to: string;
  firstName: string;
  displayName: string;
  weeklyTickets: boolean;
}): Promise<SendEmailResult> {
  const msg = artistRosterAddedEmail(opts);
  return sendEmail({ to: opts.to, ...msg });
}

export async function sendTicketEmail(payload: {
  to: string;
  ticket: Ticket;
  scanLink: string;
}): Promise<SendEmailResult> {
  const { ticket, scanLink, to } = payload;
  const qrContent = await qrPngBase64(ticket.qrToken);
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
  });
  return sendEmail({
    to,
    ...msg,
    attachments: [
      {
        filename: 'ticket-qr.png',
        content: qrContent,
        contentType: 'image/png',
        inlineContentId: TICKET_QR_CID,
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
