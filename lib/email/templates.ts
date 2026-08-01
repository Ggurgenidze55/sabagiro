import { contactTopicLabel, type ContactTopic } from '@/lib/contact-topic';
import { CLUB_RULES, VERIFICATION_REVOCATION_NOTICE } from '@/lib/club-rules';
import { escapeHtml, renderEmailLayout } from '@/lib/email/layout';
import { EMAIL_ACID, EMAIL_MUTED } from '@/lib/email/theme';
import { roleLabel, staffAdminLandingPath } from '@/lib/staff-roles';
import { siteUrl } from '@/lib/site-url';

function staffRoleBulletHtml(role: string): string {
  const items: string[] = [];
  switch (role) {
    case 'EVENT_MANAGER':
      items.push('Create and edit club events (Staff → Manage events)');
      items.push('Log in at sabagiro.ge on your phone or computer');
      break;
    case 'USER_MANAGER':
      items.push('Verify members and manage accounts');
      items.push('Set ticket limits and free-ticket access');
      break;
    case 'MAIN_MODERATOR':
      items.push('Review and verify member accounts');
      items.push('Promote members to staff roles');
      items.push(
        'Scan tickets at the door — stay logged in, open a guest QR link, tap CONFIRM ENTRY',
      );
      break;
    case 'USER':
      items.push('Staff tools are no longer available on this account');
      items.push('Your tickets and member account stay as they are');
      break;
    default:
      items.push('Open your Sabagiro account for details');
  }
  return `<ul style="margin:12px 0 0;padding-left:20px;line-height:1.55">${items
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('')}</ul>`;
}

export function welcomeRegistrationEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const bodyHtml = `
    <p>Hi ${name}, your Sabagiro account is created.</p>
    <p>We review Facebook, Instagram, or LinkedIn links before ticket purchases are enabled. You will get another email when your account is <strong>verified</strong>.</p>
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
    text: `Hi ${opts.firstName}, your Sabagiro account is created. Admin will verify your Facebook, Instagram, or LinkedIn link before you can buy tickets. Account: ${siteUrl('/account')}`,
  };
}

function clubRulesEmailHtml(): string {
  const items = CLUB_RULES.map(
    (rule) =>
      `<li style="margin:0 0 12px"><strong>${escapeHtml(rule.title)}</strong> — ${escapeHtml(rule.body)}</li>`,
  ).join('');
  return `
    <p style="margin:20px 0 12px;font-weight:700;letter-spacing:0.04em">COMMUNITY RULES</p>
    <ul style="margin:0 0 20px;padding-left:20px;line-height:1.55">${items}</ul>
    <p style="margin:0 0 16px;padding:16px;border:2px solid ${EMAIL_ACID};background:#141414;font-size:13px;line-height:1.6;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_ACID}">${escapeHtml(VERIFICATION_REVOCATION_NOTICE)}</p>
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:0">Full rules: <a href="${escapeHtml(siteUrl('/rules'))}" style="color:${EMAIL_ACID}">${escapeHtml(siteUrl('/rules'))}</a></p>
  `;
}

export function accountVerifiedEmail(opts: {
  firstName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const rulesUrl = siteUrl('/rules');
  const bodyHtml = `
    <p>Hi ${name}, your account is <strong style="color:${EMAIL_ACID}">verified</strong>.</p>
    <p>You can now buy event tickets. Your QR tickets will be emailed after each successful payment and always available in your account.</p>
    <p>As a verified member, please read and follow our community rules:</p>
    ${clubRulesEmailHtml()}
  `;
  const rulesText = CLUB_RULES.map((rule) => `- ${rule.title}: ${rule.body}`).join('\n');
  return {
    subject: 'Sabagiro — your account is verified',
    html: renderEmailLayout({
      preheader: 'You can now buy tickets — please read our rules',
      title: 'Account verified',
      bodyHtml,
      ctaLabel: 'BROWSE EVENTS',
      ctaHref: siteUrl('/events'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro account is verified. Buy tickets: ${siteUrl('/events')}

COMMUNITY RULES
${rulesText}

${VERIFICATION_REVOCATION_NOTICE}

Full rules: ${rulesUrl}`,
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

export function staffRoleChangedEmail(opts: {
  firstName: string;
  role: string;
  previousRole: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const newLabel = escapeHtml(roleLabel(opts.role));
  const prevLabel = escapeHtml(roleLabel(opts.previousRole));
  const promoted = opts.previousRole === 'USER' && opts.role !== 'USER';
  const demoted = opts.previousRole !== 'USER' && opts.role === 'USER';
  const title = demoted ? 'Staff access removed' : promoted ? 'Staff role assigned' : 'Staff role updated';
  const intro = demoted
    ? `<p>Hi ${name}, your Sabagiro staff access was removed. Your role is now <strong>Member</strong> (was ${prevLabel}).</p>`
    : promoted
      ? `<p>Hi ${name}, you have been assigned <strong style="color:${EMAIL_ACID}">${newLabel}</strong> on Sabagiro.</p>`
      : `<p>Hi ${name}, your Sabagiro staff role changed from <strong>${prevLabel}</strong> to <strong style="color:${EMAIL_ACID}">${newLabel}</strong>.</p>`;
  const bodyHtml = `
    ${intro}
    ${staffRoleBulletHtml(opts.role)}
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:16px 0 0">If this looks wrong, contact Sabagiro admin.</p>
  `;
  const ctaHref = opts.role === 'USER' ? siteUrl('/account') : siteUrl(staffAdminLandingPath(opts.role));
  const ctaLabel = opts.role === 'USER' ? 'YOUR ACCOUNT' : 'OPEN STAFF';
  const textBullets =
    opts.role === 'MAIN_MODERATOR'
      ? ' You can scan tickets at the door via guest QR links.'
      : opts.role === 'EVENT_MANAGER'
        ? ' Manage events from Staff.'
        : opts.role === 'USER_MANAGER'
          ? ' Manage member accounts.'
          : opts.role === 'USER'
            ? ' Staff access removed.'
            : '';
  return {
    subject: demoted
      ? 'Sabagiro — staff access removed'
      : `Sabagiro — your role is now ${roleLabel(opts.role)}`,
    html: renderEmailLayout({
      preheader: demoted ? 'Staff access removed' : `Role: ${roleLabel(opts.role)}`,
      title,
      bodyHtml,
      ctaLabel,
      ctaHref,
    }),
    text: `Hi ${opts.firstName}, your Sabagiro role changed from ${roleLabel(opts.previousRole)} to ${roleLabel(opts.role)}.${textBullets} ${ctaHref}`,
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

export function artistRosterRemovedEmail(opts: {
  firstName: string;
  displayName: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName);
  const rosterName = escapeHtml(opts.displayName);
  const bodyHtml = `
    <p>Hi ${name}, you have been removed from the <strong>Sabagiro DJ / artist list</strong>${rosterName !== name ? ` as <strong>${rosterName}</strong>` : ''}.</p>
    <p>You will no longer receive automatic complimentary DJ tickets by email. Contact Sabagiro if you think this is a mistake.</p>
  `;
  return {
    subject: 'Sabagiro — removed from artist list',
    html: renderEmailLayout({
      preheader: 'Removed from the Sabagiro DJ / artist list',
      title: 'Artist list',
      bodyHtml,
      ctaLabel: 'YOUR ACCOUNT',
      ctaHref: siteUrl('/account'),
    }),
    text: `Hi ${opts.firstName}, you were removed from the Sabagiro artist list as ${opts.displayName}. Contact Sabagiro if this is a mistake. Account: ${siteUrl('/account')}`,
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
    <p>Please check that your Facebook, Instagram, or LinkedIn link is correct and belongs to you, then contact Sabagiro support if you believe this is a mistake.</p>
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

export type TicketEmailEventInfo = {
  title: string;
  dayLabel?: string;
  dateLabel?: string;
  doorsOpen?: string;
  lineup?: string;
  tag?: string;
  about?: string;
  eventUrl?: string;
  mapsUrl?: string;
  coordsLabel?: string;
};

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
  qrDownloadUrl: string;
  event?: TicketEmailEventInfo | null;
}): { subject: string; html: string; text: string } {
  const holder = escapeHtml(`${opts.holderFirstName} ${opts.holderLastName}`);
  const tier = opts.tierLabel ? ` · ${escapeHtml(opts.tierLabel)}` : '';
  const qrCid = escapeHtml(opts.qrCid);
  const qrDownloadUrl = escapeHtml(opts.qrDownloadUrl);
  const event = opts.event;
  const eventTitle = escapeHtml(event?.title || opts.productName);
  const whenParts = [event?.dayLabel, event?.dateLabel]
    .filter(Boolean)
    .map((v) => escapeHtml(String(v)))
    .join(' · ');
  const doorsLabel = event?.doorsOpen?.trim() ? escapeHtml(event.doorsOpen.trim()) : '';
  const lineup = event?.lineup?.trim() ? escapeHtml(event.lineup.trim()) : '';
  const tag = event?.tag?.trim() ? escapeHtml(event.tag.trim()) : '';
  const about = event?.about?.trim() ? escapeHtml(event.about.trim()) : '';
  const eventUrl = event?.eventUrl ? escapeHtml(event.eventUrl) : '';
  const mapsUrl = event?.mapsUrl ? escapeHtml(event.mapsUrl) : '';
  const coords = event?.coordsLabel ? escapeHtml(event.coordsLabel) : '';

  const eventRows: string[] = [];
  if (whenParts) {
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">When</strong><br />${whenParts}${doorsLabel ? `<br />Doors ${doorsLabel}` : ''}</p>`,
    );
  } else if (doorsLabel) {
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">Doors</strong><br />${doorsLabel}</p>`,
    );
  }
  if (lineup) {
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">Lineup</strong><br />${lineup}</p>`,
    );
  }
  if (tag) {
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">Stage / note</strong><br />${tag}</p>`,
    );
  }
  if (about) {
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">About</strong><br />${about}</p>`,
    );
  }
  if (coords || mapsUrl) {
    const pinLine = mapsUrl
      ? `<a href="${mapsUrl}" style="color:${EMAIL_ACID}">${coords || 'Open in Maps'}</a>`
      : coords;
    eventRows.push(
      `<p style="margin:0 0 6px"><strong style="color:${EMAIL_ACID}">Location</strong><br />Sabagiro · Tbilisi${pinLine ? `<br />${pinLine}` : ''}</p>`,
    );
  }
  if (eventUrl) {
    eventRows.push(
      `<p style="margin:0"><a href="${eventUrl}" style="color:${EMAIL_ACID}">Event page →</a></p>`,
    );
  }

  const eventBlock = eventRows.length
    ? `<div style="margin:0 0 20px;padding:14px 16px;border:1px solid ${EMAIL_MUTED};background:#141414">
        <p style="margin:0 0 10px;font-weight:700;letter-spacing:0.08em;color:${EMAIL_ACID}">${eventTitle}</p>
        ${eventRows.join('')}
      </div>`
    : '';

  const bodyHtml = `
    <!-- sabagiro-ticket:${escapeHtml(opts.ticketId)} -->
    <p style="margin:0 0 16px">Your ticket for <strong style="color:${EMAIL_ACID}">${eventTitle}</strong> is below.</p>
    ${eventBlock}
    <p style="margin:0 0 20px;line-height:0">
      <img
        src="cid:${qrCid}"
        alt="Ticket QR code for ${eventTitle}"
        width="280"
        height="280"
        style="display:block;width:280px;max-width:100%;height:auto;border:4px solid ${EMAIL_ACID};background:#ffffff"
      />
    </p>
    <p style="margin:0 0 4px;font-weight:700;color:${EMAIL_ACID};letter-spacing:0.04em">${holder}</p>
    <p style="margin:0 0 16px">ID ${escapeHtml(opts.holderPersonalId)}<br />${opts.priceGel} GEL${tier}</p>
    <p style="margin:0 0 16px">
      <a href="${qrDownloadUrl}" style="display:inline-block;background:${EMAIL_ACID};color:#0a0a0a;text-decoration:none;font-weight:700;letter-spacing:0.12em;padding:12px 18px;font-size:13px">DOWNLOAD TICKET</a>
    </p>
    <p style="font-size:14px;color:${EMAIL_MUTED};margin:0">Show this QR at the door. A copy is always in <a href="${escapeHtml(siteUrl('/account'))}" style="color:${EMAIL_ACID}">your account</a>. Full ticket PNG also attached to this email.</p>
  `;

  const textEvent = [
    event?.title || opts.productName,
    whenParts ? `When: ${whenParts}` : '',
    event?.doorsOpen ? `Doors: ${event.doorsOpen}` : '',
    event?.lineup ? `Lineup: ${event.lineup}` : '',
    event?.tag ? `Note: ${event.tag}` : '',
    event?.about ? `About: ${event.about}` : '',
    'Location: Sabagiro · Tbilisi',
    event?.coordsLabel || '',
    event?.mapsUrl || '',
    event?.eventUrl || '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Sabagiro ticket — ${event?.title || opts.productName}`,
    html: renderEmailLayout({
      preheader: `Ticket for ${event?.title || opts.productName} — ${opts.holderFirstName}`,
      title: 'Your ticket',
      bodyHtml,
    }),
    text: `${textEvent}\n\nHolder: ${opts.holderFirstName} ${opts.holderLastName}\nScan: ${opts.scanLink}\nDownload QR: ${opts.qrDownloadUrl}`,
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
