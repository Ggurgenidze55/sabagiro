import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Rules — Sabagiro',
  description:
    'Sabagiro community values — respect, safety, inclusivity, and shared responsibility at the club.',
  alternates: { canonical: siteUrl('/rules') },
};

const COMMUNITY_VALUES = [
  {
    title: 'Respect',
    body: 'Respect people, nature, art, and the space itself. Harassment, discrimination, and aggressive behavior have no place here.',
  },
  {
    title: 'Community',
    body: 'This space is built by and for its community. Look after one another, be kind, and contribute positively to the atmosphere.',
  },
  {
    title: 'Expression',
    body: 'Creativity, individuality, and self-expression are encouraged. Respect the freedom of others to express themselves as well.',
  },
  {
    title: 'Responsibility',
    body: 'Take responsibility for your actions. Leave the space better than you found it and help preserve it for future visitors.',
  },
  {
    title: 'Leave No Trace',
    body: 'Dispose of waste properly, respect the environment, and minimize your impact on the surrounding nature.',
  },
  {
    title: 'Safety',
    body: 'Your safety and the safety of others matter. Act responsibly and help create a secure environment for everyone.',
  },
  {
    title: 'Respect the Art',
    body: 'Art is an essential part of this space. Do not damage, remove, or alter artworks without permission.',
  },
  {
    title: 'Inclusivity',
    body: 'Everyone is welcome. We celebrate diversity and maintain a zero-tolerance policy toward hate, discrimination, or exclusion.',
  },
  {
    title: 'Freedom with Respect',
    body: 'Enjoy the freedom to be yourself, while respecting the rights, boundaries, and experiences of others.',
  },
] as const;

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
            The management of the space reserves the right to take appropriate action in response to any violation of
            these guidelines. Such actions may include immediate removal from the premises, permanent exclusion from
            future events and activities, and, where applicable, referral to the relevant authorities.
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
