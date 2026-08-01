import type { Metadata } from 'next';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { bankGothic, eurostile } from '@/lib/site-fonts';
import { shareImageOpenGraph, shareImageTwitter } from '@/lib/share-image';
import { SITE_SEO_DESCRIPTION, SITE_SEO_TITLE } from '@/lib/site-brand';
import { getSiteBaseUrl } from '@/lib/site-url';
import './globals.css';

const siteUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_SEO_TITLE,
    template: '%s · Sabagiro',
  },
  description: SITE_SEO_DESCRIPTION,
  keywords: [
    'Sabagiro',
    'Tbilisi',
    'cable car station',
    'Music Art Community',
    'events',
    'tickets',
    'Georgia',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_GE',
    url: siteUrl,
    siteName: 'Sabagiro',
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
    images: shareImageOpenGraph(),
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
    images: shareImageTwitter(),
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/club/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/club/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/club/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/club/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${eurostile.variable} ${bankGothic.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(/SabagiroApp/i.test(navigator.userAgent)){document.documentElement.classList.add('sabagiro-in-app');}})();`,
          }}
        />
      </head>
      <body className={bankGothic.className}>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
