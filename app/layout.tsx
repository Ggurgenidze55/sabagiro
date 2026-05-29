import type { Metadata } from 'next';
import { Bebas_Neue, Share_Tech_Mono } from 'next/font/google';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { getSiteBaseUrl } from '@/lib/site-url';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

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
    images: [
      {
        url: '/club/sabagiro-logo-white.png',
        width: 462,
        height: 343,
        alt: 'Sabagiro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sabagiro — Underground · Tbilisi',
    description: siteDescription,
    images: ['/club/sabagiro-logo-white.png'],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/club/sabagiro-logo-white.png',
    shortcut: '/club/sabagiro-logo-white.png',
    apple: '/club/sabagiro-logo-white.png',
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
      <body>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
