import type { Ticket } from '@prisma/client';
import { sendEmailAsync } from '@/lib/email/client';
import {
  accountRejectedEmail,
  accountVerifiedEmail,
  passwordChangedEmail,
  passwordResetEmail,
  profileEmailChangedEmail,
  ticketPurchaseEmail,
  welcomeRegistrationEmail,
} from '@/lib/email/templates';

export function sendWelcomeRegistrationEmail(opts: { to: string; firstName: string }) {
  const msg = welcomeRegistrationEmail({ firstName: opts.firstName });
  sendEmailAsync({ to: opts.to, ...msg });
}

export function sendAccountVerifiedEmail(opts: { to: string; firstName: string }) {
  const msg = accountVerifiedEmail({ firstName: opts.firstName });
  sendEmailAsync({ to: opts.to, ...msg });
}

export function sendAccountRejectedEmail(opts: { to: string; firstName: string }) {
  const msg = accountRejectedEmail({ firstName: opts.firstName });
  sendEmailAsync({ to: opts.to, ...msg });
}

export function sendTicketEmail(payload: {
  to: string;
  ticket: Ticket;
  scanLink: string;
  qrImageDataUrl: string;
}) {
  const { ticket, scanLink, qrImageDataUrl, to } = payload;
  const msg = ticketPurchaseEmail({
    productName: ticket.productName,
    holderFirstName: ticket.holderFirstName,
    holderLastName: ticket.holderLastName,
    holderPersonalId: ticket.holderPersonalId,
    priceGel: ticket.priceGel,
    tierLabel: ticket.tierLabel,
    scanLink,
    qrImageDataUrl,
  });
  sendEmailAsync({ to, ...msg });
}

export function sendPasswordResetEmail(opts: {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  const msg = passwordResetEmail(opts);
  sendEmailAsync({ to: opts.to, ...msg });
}

export function sendPasswordChangedEmail(opts: { to: string; firstName: string }) {
  const msg = passwordChangedEmail({ firstName: opts.firstName });
  sendEmailAsync({ to: opts.to, ...msg });
}

export function sendProfileEmailChangedNotification(opts: {
  to: string;
  firstName: string;
  newEmail: string;
}) {
  const msg = profileEmailChangedEmail(opts);
  sendEmailAsync({ to: opts.to, ...msg });
}
