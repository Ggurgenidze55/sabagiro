import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { SiteChrome } from '@/components/SiteChrome';
import { isEmailConfigured } from '@/lib/email/config';
import { getContactInboxEmails } from '@/lib/contact-inbox';
import { INSTAGRAM_URL } from '@/lib/social';

export const metadata = {
  title: 'Contact — Sabagiro',
  description: 'Contact Sabagiro — tickets, events, press. Tbilisi underground club.',
};

export default function ContactPage() {
  const inboxes = getContactInboxEmails();
  const emailReady = isEmailConfigured();

  return (
    <SiteChrome current="contact" mainClassName="site-main--contact">
      <div className="contact-page">
        <header className="contact-page__header">
          <h1 className="page-title">CONTACT</h1>
          <p className="page-lead">Tickets · Events · Press · Tbilisi</p>
        </header>

        <div className="contact-layout">
          <section className="contact-info">
            <h2 className="section-title section-title--flush">Direct</h2>
            <ul className="contact-info__list">
              {inboxes.map((addr) => (
                <li key={addr}>
                  <span className="contact-info__label">Email</span>
                  <a href={`mailto:${addr}`} className="contact-info__value">
                    {addr}
                  </a>
                </li>
              ))}
              <li>
                <span className="contact-info__label">Instagram</span>
                <a
                  href={INSTAGRAM_URL}
                  className="contact-info__value"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @sabagirolisi
                </a>
              </li>
              <li>
                <span className="contact-info__label">Location</span>
                <Link href="/location" className="contact-info__value">
                  Venue & map
                </Link>
              </li>
              <li>
                <span className="contact-info__label">Tickets</span>
                <Link href="/events" className="contact-info__value">
                  Upcoming events
                </Link>
              </li>
            </ul>
            {!emailReady ? (
              <p className="notice-banner notice-banner--inline contact-info__notice">
                Form needs <code>RESEND_API_KEY</code> — email {inboxes[0]} directly.
              </p>
            ) : null}
          </section>

          <section className="contact-form-panel">
            <h2 className="section-title section-title--flush">Send a message</h2>
            <p className="contact-form-panel__hint">
              To {inboxes.join(' & ')} · confirmation copy · reply 1–2 days
            </p>
            <ContactForm />
          </section>
        </div>
      </div>
    </SiteChrome>
  );
}
