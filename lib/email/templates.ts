import { escapeHtml, renderEmailLayout } from '@/lib/email/layout';
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
    <p>Hi ${name}, your account is <strong style="color:#c8ff00">verified</strong>.</p>
    <p>You can now buy event tickets. Your QR tickets will be emailed after each successful payment and always available in your account.</p>
  `;
  return {
    subject: 'Sabagiro — your account is verified',
    html: renderEmailLayout({
      preheader: 'You can now buy tickets',
      title: 'Account verified',
      bodyHtml,
      ctaLabel: 'BROWSE EVENTS',
      ctaHref: siteUrl('/shop'),
    }),
    text: `Hi ${opts.firstName}, your Sabagiro account is verified. Buy tickets: ${siteUrl('/shop')}`,
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
  productName: string;
  holderFirstName: string;
  holderLastName: string;
  holderPersonalId: string;
  priceGel: number;
  tierLabel: string;
  scanLink: string;
  qrImageDataUrl: string;
}): { subject: string; html: string; text: string } {
  const holder = escapeHtml(`${opts.holderFirstName} ${opts.holderLastName}`);
  const tier = opts.tierLabel ? ` · ${escapeHtml(opts.tierLabel)}` : '';
  const bodyHtml = `
    <p>Your ticket for <strong>${escapeHtml(opts.productName)}</strong> is ready.</p>
    <p style="margin:8px 0 0">${holder}<br />ID ${escapeHtml(opts.holderPersonalId)}<br />${opts.priceGel} GEL${tier}</p>
    <p style="margin:20px 0 12px">
      <img src="${opts.qrImageDataUrl}" alt="Ticket QR" width="260" height="260" style="display:block;border:4px solid #c8ff00" />
    </p>
    <p style="font-size:13px;color:#8a827a">Show this QR at the door. You can also open it from your account.</p>
  `;
  return {
    subject: `Sabagiro ticket — ${opts.productName}`,
    html: renderEmailLayout({
      preheader: `Ticket for ${opts.productName}`,
      title: 'Your ticket',
      bodyHtml,
      ctaLabel: 'OPEN TICKET',
      ctaHref: opts.scanLink,
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
    <p style="word-break:break-all;font-size:13px;color:#8a827a">${url}</p>
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
