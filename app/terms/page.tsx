import Link from 'next/link';
import { LegalSections } from '@/components/LegalSections';
import { PaymentBrandLogos } from '@/components/PaymentBrandLogos';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { COMPANY_LEGAL_NAME_KA } from '@/lib/company';
import { buildTermsSections } from '@/lib/legal/terms';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Terms of Service — Sabagiro',
  description:
    'Sabagiro terms of service — operator details, ticket delivery, payments in GEL, and refunds.',
  alternates: { canonical: siteUrl('/terms') },
};

export default function TermsPage() {
  const sections = buildTermsSections();

  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">TERMS</h1>
          <p className="page-lead">
            Service terms for tickets sold by {COMPANY_LEGAL_NAME_KA} on sabagiro.ge
          </p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />
          <p className="info-page__copy info-page__copy--muted">Last updated: 6 August 2026</p>
          <LegalSections sections={sections} />
          <PaymentBrandLogos className="payment-brands--page" />
          <div className="info-page__actions">
            <Link href="/privacy" className="btn btn--ghost">
              Privacy
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Contact
            </Link>
            <Link href="/events" className="btn">
              Events
            </Link>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
