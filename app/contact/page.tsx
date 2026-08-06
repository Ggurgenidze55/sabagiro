import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { PaymentBrandLogos } from '@/components/PaymentBrandLogos';
import { SiteChrome } from '@/components/SiteChrome';
import {
  COMPANY_EMAIL,
  COMPANY_LEGAL_NAME_KA,
  COMPANY_VENUE_ADDRESS_EN,
  COMPANY_VENUE_ADDRESS_KA,
  getCompanyIdentificationCode,
  getCompanyLegalAddress,
  getCompanyPhone,
  getCompanyPhoneHref,
} from '@/lib/company';
import { getContactInboxEmail, getContactInboxEmails } from '@/lib/contact-inbox';
import { CLUB_MAPS_URL } from '@/lib/club-location';
import { INSTAGRAM_URL } from '@/lib/social';

export const metadata = {
  title: 'Contact — Sabagiro',
  description:
    'Contact Sabagiro — phone, email, address. Tickets, events, press. Music · Art · Community. Tbilisi, Georgia.',
};

export default function ContactPage() {
  const inboxes = getContactInboxEmails();
  const primaryInbox = getContactInboxEmail();
  const phone = getCompanyPhone();
  const phoneHref = getCompanyPhoneHref();
  const idCode = getCompanyIdentificationCode();
  const legalAddress = getCompanyLegalAddress();

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
              <li>
                <span className="contact-info__label">Company</span>
                <span className="contact-info__value">{COMPANY_LEGAL_NAME_KA}</span>
              </li>
              {idCode ? (
                <li>
                  <span className="contact-info__label">ID code</span>
                  <span className="contact-info__value">{idCode}</span>
                </li>
              ) : null}
              {phone && phoneHref ? (
                <li>
                  <span className="contact-info__label">Phone</span>
                  <a href={phoneHref} className="contact-info__value">
                    {phone}
                  </a>
                </li>
              ) : null}
              {inboxes.map((addr) => (
                <li key={addr}>
                  <span className="contact-info__label">Email</span>
                  <a href={`mailto:${addr}`} className="contact-info__value">
                    {addr}
                  </a>
                </li>
              ))}
              <li>
                <span className="contact-info__label">Address</span>
                <a
                  href={CLUB_MAPS_URL}
                  className="contact-info__value"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {COMPANY_VENUE_ADDRESS_EN}
                </a>
              </li>
              <li>
                <span className="contact-info__label">KA</span>
                <span className="contact-info__value">{COMPANY_VENUE_ADDRESS_KA}</span>
              </li>
              {legalAddress !== COMPANY_VENUE_ADDRESS_EN ? (
                <li>
                  <span className="contact-info__label">Legal address</span>
                  <span className="contact-info__value">{legalAddress}</span>
                </li>
              ) : null}
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
                <span className="contact-info__label">Legal</span>
                <span className="contact-info__value">
                  <Link href="/terms">Terms</Link>
                  {' · '}
                  <Link href="/privacy">Privacy</Link>
                </span>
              </li>
              <li>
                <span className="contact-info__label">Tickets</span>
                <Link href="/events" className="contact-info__value">
                  Upcoming events
                </Link>
              </li>
            </ul>
            <PaymentBrandLogos className="payment-brands--contact" />
            <p className="contact-info__notice">
              Card payments: Visa / Mastercard via Flitt · prices in GEL (₾) · support{' '}
              <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
            </p>
          </section>

          <section className="contact-form-panel">
            <h2 className="section-title section-title--flush">Send a message</h2>
            <p className="contact-form-panel__hint">
              To {primaryInbox} · confirmation copy · reply 1–2 days
            </p>
            <ContactForm />
          </section>
        </div>
      </div>
    </SiteChrome>
  );
}
