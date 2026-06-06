import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Rules — Sabagiro',
  description: 'Sabagiro club rules — entry, tickets, behaviour, and safety at the door.',
  alternates: { canonical: siteUrl('/rules') },
};

const RULES = [
  {
    title: 'Entry',
    items: [
      '18+ only. Bring valid ID — name must match your ticket.',
      'One QR scan per ticket. No screenshots, duplicates, or resale.',
      'Door decisions are final. No re-entry without a new ticket unless announced.',
    ],
  },
  {
    title: 'Respect the room',
    items: [
      'No harassment, hate speech, or violence — zero tolerance.',
      'Listen to staff and security at all times.',
      'Phones away on the floor unless the night allows otherwise.',
    ],
  },
  {
    title: 'Safety',
    items: [
      'Do not bring weapons, illegal substances, or glass bottles.',
      'Look after yourself and others. Ask staff if you need help.',
      'Smoking only in designated areas.',
    ],
  },
] as const;

export default function RulesPage() {
  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">RULES</h1>
          <p className="page-lead">Simple house rules so everyone can focus on the music.</p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />

          {RULES.map((section) => (
            <section key={section.title} className="info-page__block">
              <h2 className="section-title">{section.title}</h2>
              <ul className="info-page__list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}

          <p className="info-page__copy info-page__copy--muted">
            By entering Sabagiro you agree to these rules. We may update them per event — check back before doors.
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
