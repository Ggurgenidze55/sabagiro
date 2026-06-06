import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { getContactInboxEmails } from '@/lib/contact-inbox';
import { INSTAGRAM_URL } from '@/lib/social';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Lost & Found — Sabagiro',
  description: 'Lost something at Sabagiro? How to claim items left at the club in Tbilisi.',
  alternates: { canonical: siteUrl('/lost-and-found') },
};

export default function LostAndFoundPage() {
  const inbox = getContactInboxEmails()[0];

  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">LOST &amp; FOUND</h1>
          <p className="page-lead">Left something at the club? We keep items from event nights for a limited time.</p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />

          <section className="info-page__block">
            <h2 className="section-title">How it works</h2>
            <ul className="info-page__list">
              <li>Items found during or after an event are logged by door staff.</li>
              <li>Describe your item, the event date, and where you think you lost it.</li>
              <li>Valid ID may be required when collecting personal belongings.</li>
              <li>Unclaimed items are donated or disposed of after 30 days.</li>
            </ul>
          </section>

          <section className="info-page__block">
            <h2 className="section-title">Contact</h2>
            <p className="info-page__copy">
              Email{' '}
              <a href={`mailto:${inbox}?subject=Lost%20%26%20Found`} className="info-page__link">
                {inbox}
              </a>{' '}
              or message us on{' '}
              <a href={INSTAGRAM_URL} className="info-page__link" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              . Include a photo if you have one.
            </p>
          </section>

          <div className="info-page__actions">
            <Link href="/contact" className="btn">
              CONTACT
            </Link>
            <Link href="/" className="btn btn--ghost">
              Home
            </Link>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
