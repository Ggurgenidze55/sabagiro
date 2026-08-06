import Link from 'next/link';
import { LegalSections } from '@/components/LegalSections';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { COMPANY_LEGAL_NAME_KA } from '@/lib/company';
import { buildPrivacySections } from '@/lib/legal/privacy';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Privacy Policy — Sabagiro',
  description:
    'Sabagiro privacy policy — how შპს საბაგირო ჯგუფი processes account, ticket, and payment data.',
  alternates: { canonical: siteUrl('/privacy') },
};

export default function PrivacyPage() {
  const sections = buildPrivacySections();

  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">PRIVACY</h1>
          <p className="page-lead">
            How {COMPANY_LEGAL_NAME_KA} handles personal data on sabagiro.ge
          </p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />
          <p className="info-page__copy info-page__copy--muted">Last updated: 6 August 2026</p>
          <LegalSections sections={sections} />
          <div className="info-page__actions">
            <Link href="/terms" className="btn btn--ghost">
              Terms
            </Link>
            <Link href="/contact" className="btn btn--ghost">
              Contact
            </Link>
            <Link href="/" className="btn">
              Home
            </Link>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
