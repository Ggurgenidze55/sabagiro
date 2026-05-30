import { AboutPageContent } from '@/components/AboutPageContent';
import { SiteChrome } from '@/components/SiteChrome';

export const metadata = {
  title: 'About — Sabagiro',
  description:
    'Sabagiro — brutalist underground club in Tbilisi. Night · Concrete · Sound. Events, tickets, warehouse nights.',
};

export default function AboutPage() {
  return (
    <SiteChrome current="about">
      <AboutPageContent />
    </SiteChrome>
  );
}
