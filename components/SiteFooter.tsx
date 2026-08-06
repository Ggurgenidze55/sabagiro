import Link from 'next/link';
import { PaymentBrandLogos } from '@/components/PaymentBrandLogos';
import {
  COMPANY_EMAIL,
  COMPANY_LEGAL_NAME_KA,
  getCompanyIdentificationCode,
  getCompanyLegalAddress,
  getCompanyPhone,
  getCompanyPhoneHref,
} from '@/lib/company';
import { FOOTER_PAGE_LINKS } from '@/lib/footer-links';

export function SiteFooter() {
  const phone = getCompanyPhone();
  const phoneHref = getCompanyPhoneHref();
  const idCode = getCompanyIdentificationCode();
  const address = getCompanyLegalAddress();

  return (
    <footer className="footer" id="contact">
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
    </footer>
  );
}
