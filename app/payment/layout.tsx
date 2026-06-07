import { SiteAmbientLayers } from '@/components/SiteAmbientLayers';
import { AppBackButton } from '@/components/AppBackButton';
import { SiteFooter } from '@/components/SiteFooter';

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-page">
      <SiteAmbientLayers />
      <div className="site-page__stack">
        <div className="payment-shell">
          <header className="payment-app-bar">
            <AppBackButton fallbackHref="/events" forceShow />
          </header>
          {children}
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
