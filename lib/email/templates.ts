import { contactTopicLabel, type ContactTopic } from '@/lib/contact-topic';
import { escapeHtml, renderEmailLayout } from '@/lib/email/layout';
import { EMAIL_ACID, EMAIL_MUTED } from '@/lib/email/theme';
import { siteUrl } from '@/lib/site-url';

export function welcomeRegistrationEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, your Sabagiro account is created.</p>
    <p>We review Facebook and Instagram links before ticket purchases are enabled. You will get another email when your account is <strong>verified</strong>.</p>
    <p>Until then you can log in and update your profile, but checkout stays locked.</p>
  `;
  return {
    subject: 'Welcome to Sabagiro — registration received',
    html: renderEmailLayout({
      preheader: 'Your account was created — verification pending',
      title: 'Registration received',
      bodyHtml,
      ctaLabel: 'VIEW ACCOUNT',
      ctaHref: siteUrl('/account'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro account is created. Admin will verify your social links before you can buy tickets. Account: ${siteUrl('/account')}`,
  };
}

export function accountVerifiedEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, your account is <strong style="color:${EMAIL_ACID}">verified</strong>.</p>
    <p>You can now buy event tickets. Your QR tickets will be emailed after each successful payment and always available in your account.</p>
  `;
  return {
    subject: 'Sabagiro — your account is verified',
    html: renderEmailLayout({
      preheader: 'You can now buy tickets',
      title: 'Account verified',
      bodyHtml,
      ctaLabel: 'BROWSE EVENTS',
      ctaHref: siteUrl('/events'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro account is verified. Buy tickets: ${siteUrl('/events')}`,
  };
}

export function accountPendingEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, your Sabagiro account is back under review.</p>
    <p>Ticket checkout stays locked until verification is complete. We will email you again when your status changes.</p>
  `;
  return {
    subject: 'Sabagiro — account under review',
    html: renderEmailLayout({
      preheader: 'Verification pending',
      title: 'Review in progress',
      bodyHtml,
      ctaLabel: 'ACCOUNT',
      ctaHref: siteUrl('/account'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro account is pending verification again. Account: ${siteUrl('/account')}`,
  };
}

export function freeTicketsEnabledEmail(opts: {
  firstName: string;
  quota: number;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, you can now generate <strong>${opts.quota}</strong> complimentary ticket(s) per event from your Sabagiro account.</p>
    <p>Open an event page while logged in and use the free ticket form. Each ticket is emailed with a QR code.</p>
  `;
  return {
    subject: 'Sabagiro — complimentary tickets enabled',
    html: renderEmailLayout({
      preheader: 'Free tickets are available on your account',
      title: 'Free tickets enabled',
      bodyHtml,
      ctaLabel: 'BROWSE EVENTS',
      ctaHref: siteUrl('/events'),
    }),
    text: `Hi ${opts.firstName}, you can generate ${opts.quota} free ticket(s) per event. Events: ${siteUrl('/events')}`,
  };
}

export function doorScanEnabledEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, <strong style="color:${EMAIL_ACID}">door scan access</strong> is now enabled on your Sabagiro account.</p>
    <p>At the club entrance, stay logged in on your phone, open a guest's ticket QR link, and tap <strong>CONFIRM ENTRY</strong>. Each QR works once.</p>
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:0">If you lose access or have questions, contact Sabagiro admin.</p>
  `;
  return {
    subject: 'Sabagiro — door scan access enabled',
    html: renderEmailLayout({
      preheader: 'You can confirm ticket entry at the door',
      title: 'Door scan enabled',
      bodyHtml,
      ctaLabel: 'LOG IN',
      ctaHref: siteUrl('/login'),
    }),
    text: `Hi ${opts.firstName}, door scan access is enabled on your Sabagiro account. Log in on your phone at the door and confirm guest QR codes. Log in: ${siteUrl('/login')}`,
  };
}

export function doorScanDisabledEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, <strong>door scan access</strong> has been removed from your Sabagiro account.</p>
    <p>You can no longer confirm ticket entry at the door with this account. Contact Sabagiro if you think this is a mistake.</p>
  `;
  return {
    subject: 'Sabagiro — door scan access removed',
    html: renderEmailLayout({
      preheader: 'Door scan access was turned off',
      title: 'Door scan disabled',
      bodyHtml,
      ctaLabel: 'YOUR ACCOUNT',
      ctaHref: siteUrl('/account'),
    }),
    text: `Hi ${opts.firstName}, door scan access was removed from your Sabagiro account. Account: ${siteUrl('/account')}`,
  };
}

export function artistRosterAddedEmail(opts: {
  firstName: string;
  displayName: string;
  weeklyTickets: boolean;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const rosterName = escapeHtml(opts.displayName);
  const scheduleLine = opts.weeklyTickets
    ? `<p>For each upcoming event with DJ tickets enabled, you will receive one complimentary QR ticket by email <strong style="color:${EMAIL_ACID}">one day before the event date</strong> (Tbilisi time). Each ticket is also saved in your account.</p>`
    : `<p>You are on the list with auto-tickets turned off. Contact Sabagiro if you need event tickets.</p>`;
  const bodyHtml = `
    <p>Hi ${name}, you have been added to the <strong style="color:${EMAIL_ACID}">Sabagiro artist list</strong>${rosterName !== name ? ` as <strong>${rosterName}</strong>` : ''}.</p>
    ${scheduleLine}
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:0">Show your QR at the door. See you underground.</p>
  `;
  return {
    subject: 'Sabagiro — you\'re on the artist list',
    html: renderEmailLayout({
      preheader: 'Added to the Sabagiro DJ / artist list',
      title: 'Artist list',
      bodyHtml,
      ctaLabel: 'YOUR ACCOUNT',
      ctaHref: siteUrl('/account'),
    }),
    text: `Hi ${opts.firstName}, you were added to the Sabagiro artist list as ${opts.displayName}. ${
      opts.weeklyTickets
        ? 'Comp tickets are emailed one day before each event (when DJ tickets are enabled for that event).'
        : 'Auto-tickets are off on your profile.'
    } Account: ${siteUrl('/account')}`,
  };
}

export function accountRejectedEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, we could not verify your account at this time.</p>
    <p>Please check that your Facebook and Instagram links are correct and belong to you, then contact Sabagiro support if you believe this is a mistake.</p>
  `;
  return {
    subject: 'Sabagiro — account verification update',
    html: renderEmailLayout({
      preheader: 'Verification was not approved',
      title: 'Verification not approved',
      bodyHtml,
      ctaLabel: 'ACCOUNT SETTINGS',
      ctaHref: siteUrl('/account/settings'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro verification was not approved. Update your profile: ${siteUrl('/account/settings')}`,
  };
}

export function ticketPurchaseEmail(opts: {
  ticketId: string;
  productName: string;
  holderFirstName: string;
  holderLastName: string;
  holderPersonalId: string;
  priceGel: number;
  tierLabel: string;
  scanLink: string;
  qrCid: string;
}): { subject: string; html: string; text: string } {
  const holder = escapeHtml(`${opts.holderFirstName} ${opts.holderLastName}`);
  const tier = opts.tierLabel ? ` · ${escapeHtml(opts.tierLabel)}` : '';
  const qrCid = escapeHtml(opts.qrCid);
  const bodyHtml = `
    <!-- sabagiro-ticket:${escapeHtml(opts.ticketId)} -->
    <p style="margin:0 0 16px">Your ticket for <strong style="color:${EMAIL_ACID}">${escapeHtml(opts.productName)}</strong> is below.</p>
    <p style="margin:0 0 20px;line-height:0">
      <img
        src="cid:${qrCid}"
        alt="Ticket QR code for ${escapeHtml(opts.productName)}"
        width="280"
        height="280"
        style="display:block;width:280px;max-width:100%;height:auto;border:4px solid ${EMAIL_ACID};background:#ffffff"
      />
    </p>
    <p style="margin:0 0 4px;font-weight:700;color:${EMAIL_ACID};letter-spacing:0.04em">${holder}</p>
    <p style="margin:0 0 16px">ID ${escapeHtml(opts.holderPersonalId)}<br />${opts.priceGel} GEL${tier}</p>
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:0">Show this QR at the door. A copy is always in <a href="${escapeHtml(siteUrl('/account'))}" style="color:${EMAIL_ACID}">your account</a>.</p>
  `;
  return {
    subject: `Sabagiro ticket — ${opts.productName}`,
    html: renderEmailLayout({
      preheader: `Ticket for ${opts.productName} — ${opts.holderFirstName}`,
      title: 'Your ticket',
      bodyHtml,
    }),
    text: `Ticket: ${opts.productName}. Holder: ${opts.holderFirstName} ${opts.holderLastName}. QR: ${opts.scanLink}`,
  };
}

export function passwordResetEmail(opts: {
  firstName: string;
  resetUrl: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const url = escapeHtml(opts.resetUrl);
  const bodyHtml = `
    <p>Hi ${name}, we received a request to reset your Sabagiro password.</p>
    <p>This link expires in <strong>${opts.expiresMinutes} minutes</strong>. If you did not request this, you can ignore this email.</p>
    <p style="word-break:break-all;font-size:14px;color:${EMAIL_MUTED}">${url}</p>
  `;
  return {
    subject: 'Sabagiro — reset your password',
    html: renderEmailLayout({
      preheader: 'Password reset link',
      title: 'Reset password',
      bodyHtml,
      ctaLabel: 'RESET PASSWORD',
      ctaHref: opts.resetUrl,
    }),
    text: `Reset your Sabagiro password (expires in ${opts.expiresMinutes} min): ${opts.resetUrl}`,
  };
}

export function passwordChangedEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, your Sabagiro password was changed successfully.</p>
    <p>If this was not you, reset your password immediately and contact support.</p>
  `;
  return {
    subject: 'Sabagiro — password changed',
    html: renderEmailLayout({
      preheader: 'Your password was updated',
      title: 'Password updated',
      bodyHtml,
      ctaLabel: 'LOG IN',
      ctaHref: siteUrl('/login'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro password was changed. Log in: ${siteUrl('/login')}`,
  };
}

export function profileEmailChangedEmail(opts: {
  firstName: string;
  newEmail: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, the email on your Sabagiro account was updated to <strong>${escapeHtml(opts.newEmail)}</strong>.</p>
    <p>If you did not make this change, contact support immediately.</p>
  `;
  return {
    subject: 'Sabagiro — email address updated',
    html: renderEmailLayout({
      preheader: 'Your account email was changed',
      title: 'Email updated',
      bodyHtml,
      ctaLabel: 'ACCOUNT',
      ctaHref: siteUrl('/account/settings'),
    }),
    text: `Your Sabagiro email was changed to ${opts.newEmail}. Settings: ${siteUrl('/account/settings')}`,
  };
}

export function contactFormNotificationEmail(opts: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}): { subject: string; html: string; text: string } {
  const topicLabel = contactTopicLabel(opts.topic);
  const bodyHtml = `
    <p><strong>From:</strong> ${escapeHtml(opts.name)} &lt;${escapeHtml(opts.email)}&gt;</p>
    <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
    <p style="margin-top:16px;white-space:pre-wrap;line-height:1.55">${escapeHtml(opts.message)}</p>
  `;
  return {
    subject: `Sabagiro contact [${opts.topic}]`,
    html: renderEmailLayout({
      preheader: `Message from ${opts.name}`,
      title: 'New contact message',
      bodyHtml,
      ctaLabel: 'REPLY BY EMAIL',
      ctaHref: `mailto:${encodeURIComponent(opts.email)}`,
    }),
    text: `Contact form\nFrom: ${opts.name} <${opts.email}>\nTopic: ${topicLabel}\n\n${opts.message}`,
  };
}

export function contactFormAckEmail(opts: {
  name: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.name);
  const bodyHtml = `
    <p>Hi ${name}, we received your message.</p>
    <p>We usually reply within 1–2 days. For urgent ticket issues at the door, use the email on your ticket QR.</p>
  `;
  return {
    subject: 'Sabagiro — we got your message',
    html: renderEmailLayout({
      preheader: 'Message received',
      title: 'Thanks for contacting us',
      bodyHtml,
      ctaHref: siteUrl('/events'),
      ctaLabel: 'VIEW EVENTS',
    }),
    text: `Hi ${opts.name}, we received your Sabagiro contact form message. We'll reply by email soon.`,
  };
}

export function testEmail(): { subject: string; html: string; text: string } {
  const bodyHtml = `
    <p>Resend is connected. Sabagiro transactional email is ready.</p>
    <p>This test covers: registration, verification, tickets, password reset.</p>
  `;
  return {
    subject: 'Sabagiro — email test',
    html: renderEmailLayout({
      preheader: 'Resend connection test',
      title: 'Email test OK',
      bodyHtml,
      ctaLabel: 'OPEN SITE',
      ctaHref: siteUrl('/'),
    }),
    text: `Sabagiro email test OK. Site: ${siteUrl('/')}`,
  };
}
