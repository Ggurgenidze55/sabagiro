import { SitePixelBackground } from '@/components/SitePixelBackground';

/** Fixed full-page ambient layers (homepage matrix + grain + scanlines). */
export function SiteAmbientLayers() {
  return (
    <div className="site-page__ambient" aria-hidden>
      <SitePixelBackground />
      <div className="site-page__fade" />
      <div className="site-page__vignette" />
      <div className="site-page__grain" />
      <div className="site-page__scanlines" />
    </div>
  );
}
