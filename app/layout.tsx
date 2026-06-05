import type { Metadata } from 'next';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { bebasNeue, shareTechMono } from '@/lib/site-fonts';
import { shareImageOpenGraph, shareImageTwitter } from '@/lib/share-image';
import { getSiteBaseUrl } from '@/lib/site-url';
import './globals.css';

const siteUrl = getSiteBaseUrl();
const siteDescription =
  'Sabagiro — underground club in Tbilisi. Events, tickets, techno nights. Night · Concrete · Sound.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sabagiro — Underground · Tbilisi',
    template: '%s · Sabagiro',
  },
  description: siteDescription,
  keywords: ['Sabagiro', 'Tbilisi club', 'Georgia nightlife', 'techno', 'tickets', 'underground'],
  openGraph: {
    type: 'website',
    locale: 'en_GE',
    url: siteUrl,
    siteName: 'Sabagiro',
    title: 'Sabagiro — Underground · Tbilisi',
    description: siteDescription,
    images: shareImageOpenGraph(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabagiro — Underground · Tbilisi',
    description: siteDescription,
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
    <html lang="en" className={`${bebasNeue.variable} ${shareTechMono.variable}`}>
      <body className={shareTechMono.className}>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
