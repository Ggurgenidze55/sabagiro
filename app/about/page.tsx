import type { Metadata } from 'next';
import { AboutPageContent } from '@/components/AboutPageContent';
import { SiteChrome } from '@/components/SiteChrome';
import { shareImageOpenGraph, shareImageTwitter } from '@/lib/share-image';
import { siteUrl } from '@/lib/site-url';

const aboutTitle = 'About — Sabagiro';
const aboutDescription =
  'Sabagiro — brutalist underground club in Tbilisi. Night · Concrete · Sound. Events, tickets, warehouse nights.';

export const metadata: Metadata = {
  title: aboutTitle,
  description: aboutDescription,
  alternates: {
    canonical: siteUrl('/about'),
  },
  openGraph: {
    type: 'website',
    url: siteUrl('/about'),
    title: aboutTitle,
    description: aboutDescription,
    images: shareImageOpenGraph(),
  },
  twitter: {
    card: 'summary_large_image',
    title: aboutTitle,
    description: aboutDescription,
    images: shareImageTwitter(),
  },
};

export default function AboutPage() {
  return (
    <SiteChrome current="about">
      <AboutPageContent />
    </SiteChrome>
  );
}
