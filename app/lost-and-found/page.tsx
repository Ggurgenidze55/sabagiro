import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { getContactInboxEmails } from '@/lib/contact-inbox';
import { INSTAGRAM_URL } from '@/lib/social';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Lost & Found — Sabagiro',
  description: 'Lost or found something at Sabagiro? How to report items and what to expect.',
  alternates: { canonical: siteUrl('/lost-and-found') },
};

const LOST_FOUND_COPY = [
  'If you lose or find an item within the space, please report it to our team.',
  'Found items will be stored for a limited period and reasonable efforts will be made to return them to their owners.',
  'While we will do our best to assist, the space and its management cannot accept responsibility for lost, stolen, or damaged personal belongings.',
  'Any unclaimed items may be donated, recycled, or disposed of after the designated holding period.',
  'Please keep your valuables with you at all times.',
] as const;

export default function LostAndFoundPage() {
  const inbox = getContactInboxEmails()[0];

  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">LOST &amp; FOUND</h1>
          <p className="page-lead">
            Report lost or found items to our team. We store found belongings for a limited time.
          </p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />

          {LOST_FOUND_COPY.map((paragraph) => (
            <p key={paragraph} className="info-page__copy">
              {paragraph}
            </p>
          ))}

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
              . Include a photo and the event date if you have them.
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
