import { EMAIL_ACID, EMAIL_BG, EMAIL_BORDER, EMAIL_CARD, EMAIL_MUTED, EMAIL_TEXT } from '@/lib/email/theme';
import { siteUrl } from '@/lib/site-url';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type LayoutOpts = {
  preheader?: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function renderEmailLayout(opts: LayoutOpts): string {
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : '';
  const title = escapeHtml(opts.title);
  const accountUrl = siteUrl('/account');
  const eventsUrl = siteUrl('/events');
  const homeUrl = siteUrl('/');
  const logoUrl = siteUrl('/club/sabagiro-logo.png');

  const cta =
    opts.ctaLabel && opts.ctaHref
      ? `<p style="margin:28px 0 0">
          <a href="${escapeHtml(opts.ctaHref)}" style="display:inline-block;background:${EMAIL_ACID};color:${EMAIL_BG};text-decoration:none;font-weight:700;letter-spacing:0.12em;padding:14px 22px;font-size:14px">${escapeHtml(opts.ctaLabel)}</a>
        </p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG}">
  <span style="display:none;max-height:0;overflow:hidden;color:${EMAIL_BG}">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${EMAIL_CARD};border:1px solid ${EMAIL_BORDER};border-top:3px solid ${EMAIL_ACID}">
          <tr>
            <td style="padding:28px 28px 8px;font-family:ui-monospace,Menlo,monospace">
              <a href="${escapeHtml(homeUrl)}" style="display:inline-block;margin:0 0 14px;text-decoration:none">
                <img
                  src="${escapeHtml(logoUrl)}"
                  alt="Sabagiro"
                  width="132"
                  height="98"
                  style="display:block;width:132px;height:auto;border:0;outline:none"
                />
              </a>
              <h1 style="margin:0;color:${EMAIL_ACID};font-size:22px;font-weight:700;letter-spacing:0.06em">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-family:system-ui,-apple-system,sans-serif;color:${EMAIL_TEXT};font-size:16px;line-height:1.55">
              ${opts.bodyHtml}
              ${cta}
              <hr style="border:none;border-top:1px solid ${EMAIL_BORDER};margin:28px 0 20px" />
              <p style="margin:0;font-size:14px;color:${EMAIL_MUTED};line-height:1.5">
                Underground · Tbilisi<br />
                <a href="${escapeHtml(accountUrl)}" style="color:${EMAIL_ACID}">Your account</a>
                ·
                <a href="${escapeHtml(eventsUrl)}" style="color:${EMAIL_ACID}">Events</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
