import Link from 'next/link';
import { SiteFooterBrand } from '@/components/SiteFooterBrand';
import { FOOTER_PAGE_LINKS } from '@/lib/footer-links';
import { INSTAGRAM_URL } from '@/lib/social';

const SOCIAL_LINKS = [
  { href: INSTAGRAM_URL, label: 'Instagram' },
  { href: 'https://ra.co', label: 'RA' },
  { href: 'https://soundcloud.com', label: 'SoundCloud' },
] as const;

export function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <SiteFooterBrand />
      <nav className="footer__nav" aria-label="Info">
        {FOOTER_PAGE_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
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
