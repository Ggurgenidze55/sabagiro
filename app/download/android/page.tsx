import Link from 'next/link';
import { SectionDivider } from '@/components/SectionDivider';
import { SiteChrome } from '@/components/SiteChrome';
import { APP_DOWNLOAD_ANDROID_APK } from '@/lib/app-downloads';
import { siteUrl } from '@/lib/site-url';

export const metadata = {
  title: 'Android app — Sabagiro',
  description: 'Download the Sabagiro Android app — tickets, events, and account in one place.',
  alternates: { canonical: siteUrl('/download/android') },
};

const STEPS = [
  'Tap Download APK below. Use Chrome or Samsung Internet if another browser fails.',
  'If Google Play Protect appears, tap More details, then Install anyway. This is normal for apps not yet on the Play Store.',
  'If Android asks to allow installs from your browser, tap Settings and turn it on for this download.',
  'When install finishes, open Sabagiro from your home screen.',
] as const;

export default function AndroidDownloadPage() {
  return (
    <SiteChrome>
      <div className="centered-page">
        <header className="centered-page__intro">
          <h1 className="page-title">ANDROID APP</h1>
          <p className="page-lead">Sabagiro on your phone — same tickets, login, and checkout as the website.</p>
        </header>

        <div className="centered-page__body info-page">
          <SectionDivider className="section-divider--first" />

          <section className="info-page__block">
            <h2 className="section-title">Download</h2>
            <p className="info-page__copy">
              The app is not on Google Play yet. We host the install file directly from sabagiro.ge.
            </p>
            <div className="info-page__actions info-page__actions--stack">
              <a href={APP_DOWNLOAD_ANDROID_APK} className="btn" download="sabagiro-android.apk">
                Download APK
              </a>
              <img
                src="/club/badge-google-play.svg"
                alt=""
                width="155"
                height="40"
                aria-hidden="true"
                className="download-page__badge"
              />
            </div>
          </section>

          <section className="info-page__block">
            <h2 className="section-title">Install steps</h2>
            <ol className="info-page__list info-page__list--ordered">
              {STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="info-page__copy info-page__copy--muted">
              Play Protect warning: Play Protect has not seen this developer before. That is expected until we publish on
              Google Play. Choose Install anyway — do not tap Got it only, or install will cancel.
            </p>
          </section>

          <div className="info-page__actions">
            <Link href="/events" className="btn btn--ghost">
              Events
            </Link>
            <Link href="/" className="btn btn--ghost">
              Home
            </Link>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
