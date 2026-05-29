import { getSiteBaseUrl } from '@/lib/site-url';

function escapeScriptValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** HTML snippets for static homepage + server-rendered injection. */
export function buildHomepageSeoHeadHtml(): string {
  const base = getSiteBaseUrl();
  const title = 'Sabagiro — Underground · Tbilisi';
  const description =
    'Sabagiro — underground club in Tbilisi. Events, tickets, techno nights. Night · Concrete · Sound.';
  const image = `${base}/club/sabagiro-logo-white.png`;

  return [
    `<link rel="canonical" href="${base}/" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="en_GE" />`,
    `<meta property="og:url" content="${base}/" />`,
    `<meta property="og:site_name" content="Sabagiro" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n');
}

/** HTML snippets for static homepage + server-rendered injection. */
export function buildAnalyticsHeadHtml(): string {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const googleVerify = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  const parts: string[] = [];

  if (googleVerify) {
    parts.push(`<meta name="google-site-verification" content="${googleVerify}" />`);
  }

  if (gaId) {
    const id = escapeScriptValue(gaId);
    parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`);
    parts.push(`<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${id}');
</script>`);
  }

  if (pixelId) {
    const id = escapeScriptValue(pixelId);
    parts.push(`<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');
fbq('track','PageView');
</script>`);
    parts.push(
      `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${pixelId}&amp;ev=PageView&amp;noscript=1" /></noscript>`,
    );
  }

  return parts.join('\n');
}

export function hasAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim(),
  );
}

export { getSiteBaseUrl };
