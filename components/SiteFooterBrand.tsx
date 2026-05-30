import { SITE_COPYRIGHT_YEAR, SITE_CREDIT_NAME } from '@/lib/site-brand';

type SiteFooterBrandProps = {
  className?: string;
};

export function SiteFooterBrand({ className }: SiteFooterBrandProps) {
  return (
    <div className={['footer__brand', className].filter(Boolean).join(' ')}>
      <span className="footer__credit">{SITE_CREDIT_NAME}</span>
      <span className="footer__copyright">© Sabagiro {SITE_COPYRIGHT_YEAR}</span>
    </div>
  );
}
