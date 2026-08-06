import Link from 'next/link';
import { PaymentBrandLogos } from '@/components/PaymentBrandLogos';
import { SiteFooterBrand } from '@/components/SiteFooterBrand';
import {
  COMPANY_EMAIL,
  COMPANY_LEGAL_NAME_KA,
  getCompanyIdentificationCode,
  getCompanyLegalAddress,
  getCompanyPhone,
  getCompanyPhoneHref,
} from '@/lib/company';
import { FOOTER_PAGE_LINKS } from '@/lib/footer-links';
import { INSTAGRAM_URL } from '@/lib/social';

const SOCIAL_LINKS = [
  { href: INSTAGRAM_URL, label: 'Instagram' },
  { href: 'https://ra.co', label: 'RA' },
  { href: 'https://soundcloud.com', label: 'SoundCloud' },
] as const;

export function SiteFooter() {
  const phone = getCompanyPhone();
  const phoneHref = getCompanyPhoneHref();
  const idCode = getCompanyIdentificationCode();
  const address = getCompanyLegalAddress();

  return (
    <footer className="footer" id="contact">
      <SiteFooterBrand />
      <p className="footer__legal">
        {COMPANY_LEGAL_NAME_KA}
        {idCode ? ` · ID ${idCode}` : ''}
        <br />
        <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
        {phone && phoneHref ? (
          <>
            {' · '}
            <a href={phoneHref}>{phone}</a>
          </>
        ) : null}
        <br />
        <span>{address}</span>
      </p>
      <nav className="footer__nav" aria-label="Info">
        {FOOTER_PAGE_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <PaymentBrandLogos className="payment-brands--footer" />
      <ul className="social">
        {SOCIAL_LINKS.map((item) => (
          <li key={item.label}>
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
