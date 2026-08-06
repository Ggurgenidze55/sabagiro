import {
  COMPANY_BRAND,
  COMPANY_EMAIL,
  COMPANY_LEGAL_NAME_EN,
  COMPANY_LEGAL_NAME_KA,
  getCompanyLegalAddress,
  getCompanyPhone,
} from '@/lib/company';
import type { LegalSection } from '@/lib/legal/terms';

export function buildPrivacySections(): LegalSection[] {
  const phone = getCompanyPhone();
  const address = getCompanyLegalAddress();

  return [
    {
      title: '1. Who we are',
      paragraphs: [
        `${COMPANY_BRAND} (sabagiro.ge) is operated by ${COMPANY_LEGAL_NAME_KA} (${COMPANY_LEGAL_NAME_EN}).`,
        `Data controller contact: ${COMPANY_EMAIL}${phone ? ` · ${phone}` : ''}. Address: ${address}.`,
      ],
    },
    {
      title: '2. Data we collect',
      paragraphs: [
        'Depending on how you use the site, we may process:',
      ],
      bullets: [
        'Account data: name, email, phone, personal ID (where required for tickets), password hash.',
        'Order and ticket data: event, price, payment status, QR tokens, holder details for guest tickets.',
        'Messages you send via the contact form.',
        'Technical logs needed to run the service (e.g. security, error, and payment callback metadata).',
        'Analytics / advertising identifiers only if you have configured them (e.g. GA4, Meta Pixel) via site settings.',
      ],
    },
    {
      title: '3. Why we use data',
      paragraphs: [
        'We process personal data to:',
      ],
      bullets: [
        'Create and manage your account and tickets.',
        'Process payments and prevent fraud (via Flitt and banks).',
        'Send transactional email (registration, tickets, password reset, support).',
        'Operate door scan and venue entry.',
        'Comply with legal and accounting obligations.',
      ],
    },
    {
      title: '4. Sharing',
      paragraphs: [
        'We do not sell your personal data. We share data only with processors needed to run the service, for example:',
      ],
      bullets: [
        'Payment provider (Flitt) and card networks for checkout.',
        'Email delivery (e.g. Resend) for transactional mail.',
        'Hosting / database providers that store the application data.',
        'Authorities when required by law.',
      ],
    },
    {
      title: '5. Retention',
      paragraphs: [
        'Account and ticket records are kept while your account is active and as long as needed for entry, support, dispute handling, and legal retention (including payment records).',
        'You may request account closure or data access/correction by emailing us. Some records may be retained where the law requires.',
      ],
    },
    {
      title: '6. Security',
      paragraphs: [
        'We use HTTPS, access controls, and hashed passwords. No method of transmission or storage is 100% secure; report concerns to our contact email.',
      ],
    },
    {
      title: '7. Your rights',
      paragraphs: [
        'Subject to Georgian law, you may request access, correction, deletion, or restriction of processing, and you may lodge a complaint with the relevant supervisory authority.',
        `Contact: ${COMPANY_EMAIL}.`,
      ],
    },
    {
      title: '8. Updates',
      paragraphs: [
        'We may update this policy; the current version is always published on this page with the date below.',
      ],
    },
  ];
}
