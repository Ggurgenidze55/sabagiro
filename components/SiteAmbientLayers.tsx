/** App pages: muted palette texture + grain. Matrix only on public/index.html. */
export function SiteAmbientLayers() {
  return (
    <div className="site-page__ambient site-page__ambient--textured" aria-hidden>
      <div className="site-page__palette" />
      <div className="site-page__fade" />
      <div className="site-page__grain" />
      <div className="site-page__vignette" />
    </div>
  );
}
