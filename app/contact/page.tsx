import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { SiteChrome } from '@/components/SiteChrome';
import { isEmailConfigured } from '@/lib/email/config';
import { getContactInboxEmail } from '@/lib/contact-inbox';
import { INSTAGRAM_URL } from '@/lib/social';

export const metadata = {
  title: 'Contact — Sabagiro',
  description: 'Contact Sabagiro — tickets, events, press. Tbilisi underground club.',
};

export default function ContactPage() {
  const inbox = getContactInboxEmail();
  const emailReady = isEmailConfigured();

  return (
    <SiteChrome current="contact">
      <h1 className="page-title">CONTACT</h1>
      <p className="page-lead">Tickets · Events · Press · Tbilisi</p>

      <div className="contact-layout">
        <section className="contact-info">
          <h2 className="section-title">Direct</h2>
          <ul className="contact-info__list">
            <li>
              <span className="contact-info__label">Email</span>
              <a href={`mailto:${inbox}`} className="contact-info__value">
                {inbox}
              </a>
            </li>
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
              Form delivery needs <code>RESEND_API_KEY</code> on the server. You can still email us
              directly at {inbox}.
            </p>
          ) : null}
        </section>

        <section className="contact-form-panel">
          <h2 className="section-title">Send a message</h2>
          <p className="page-lead contact-form-panel__hint">
            We reply from {inbox}. For urgent door access, use the email on your ticket.
          </p>
          <ContactForm />
        </section>
      </div>
    </SiteChrome>
  );
}
