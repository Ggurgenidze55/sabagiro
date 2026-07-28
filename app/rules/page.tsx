import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { CLUB_RULES, CLUB_RULES_ENFORCEMENT } from '@/lib/club-rules';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Rules — Sabagiro',
  description:
    'Sabagiro community values — respect, safety, inclusivity, and shared responsibility at the club.',
  alternates: { canonical: siteUrl('/rules') },
};

const COMMUNITY_VALUES = CLUB_RULES;

export default function RulesPage() {
  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">RULES</h1>
          <p className="page-lead">Community values for a shared space of culture, music, creativity, and community.</p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />

          <section className="info-page__block">
            <h2 className="section-title">Community values</h2>
          </section>

          {COMMUNITY_VALUES.map((value) => (
            <section key={value.title} className="info-page__block">
              <h2 className="section-title">{value.title}</h2>
              <p className="info-page__copy">{value.body}</p>
            </section>
          ))}

          <p className="info-page__copy">
            This is more than a venue. It is a shared space for culture, music, creativity, and community.
          </p>

          <p className="info-page__copy info-page__copy--muted">
            {CLUB_RULES_ENFORCEMENT}
          </p>

          <div className="info-page__actions">
            <Link href="/events" className="btn">
              EVENTS
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
