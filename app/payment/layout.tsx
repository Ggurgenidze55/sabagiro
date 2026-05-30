import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { SiteFooter } from '@/components/SiteFooter';

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
