'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSabagiroAppShell } from '@/lib/app-shell';
import { canUseAppleWalletClient } from '@/lib/apple-wallet-device';
import { canUseGoogleWalletClient } from '@/lib/google-wallet-device';
import { canNativeSaveImageToPhotos, nativeSaveImageToPhotos } from '@/lib/native-bridge';

type TicketQrCardProps = {
  ticketId: string;
  productName: string;
  status: string;
  holderName: string;
  personalId: string;
  issuanceLine?: string;
  qrAvailable?: boolean;
  expiredMessage?: string;
};

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function prefersMobileSaveUi() {
  if (typeof window === 'undefined') return false;
  if (isSabagiroAppShell()) return true;
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

async function sharePngFile(blob: Blob, filename: string): Promise<boolean> {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav || typeof nav.share !== 'function') return false;
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    const payload: ShareData = { files: [file], title: 'Sabagiro ticket' };
    if (nav.canShare && !nav.canShare(payload)) return false;
    await nav.share(payload);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return true;
    return false;
  }
}

export function TicketQrCard({
  ticketId,
  productName,
  status,
  holderName,
  personalId,
  issuanceLine,
  qrAvailable = true,
  expiredMessage = 'This event has passed. QR code is no longer available.',
}: TicketQrCardProps) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [appleWalletEnabled, setAppleWalletEnabled] = useState(false);
  const [googleWalletEnabled, setGoogleWalletEnabled] = useState(false);
  const deviceSupportsAppleWallet = canUseAppleWalletClient();
  const deviceSupportsGoogleWallet = canUseGoogleWalletClient();
  const [loading, setLoading] = useState(false);
  const [googleWalletBusy, setGoogleWalletBusy] = useState(false);
  const [googleWalletError, setGoogleWalletError] = useState('');
  const [appleWalletBusy, setAppleWalletBusy] = useState(false);
  const [appleWalletError, setAppleWalletError] = useState('');
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [passPreviewUrl, setPassPreviewUrl] = useState<string | null>(null);
  const [passPreviewBlob, setPassPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const inNativeApp = isSabagiroAppShell();
  const android = isAndroidDevice();
  const mobileSaveUi = prefersMobileSaveUi();

  useEffect(() => {
    if (!open || !qrAvailable) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setGoogleWalletError('');

    const walletStatusPromise =
      deviceSupportsAppleWallet || deviceSupportsGoogleWallet
        ? fetch('/api/wallet/status')
            .then((r) => r.json())
            .then((d) => ({
              apple: Boolean(d.appleWallet),
              google: Boolean(d.googleWallet),
            }))
            .catch(() => ({ apple: false, google: false }))
        : Promise.resolve({ apple: false, google: false });

    Promise.all([
      fetch(`/api/tickets/${ticketId}/qr`).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load QR');
        return d;
      }),
      walletStatusPromise,
    ])
      .then(([qr, wallet]) => {
        if (cancelled) return;
        if (qr.dataUrl) setDataUrl(qr.dataUrl);
        if (qr.qrToken) setQrToken(qr.qrToken);
        setAppleWalletEnabled(wallet.apple && deviceSupportsAppleWallet);
        setGoogleWalletEnabled(wallet.google && deviceSupportsGoogleWallet);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load QR');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId, qrAvailable, open, deviceSupportsAppleWallet, deviceSupportsGoogleWallet]);

  useEffect(() => {
    return () => {
      if (passPreviewUrl) URL.revokeObjectURL(passPreviewUrl);
    };
  }, [passPreviewUrl]);

  const closePassPreview = useCallback(() => {
    setPassPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPassPreviewBlob(null);
  }, []);

  const addToGoogleWallet = useCallback(async () => {
    setGoogleWalletBusy(true);
    setGoogleWalletError('');
    try {
      const response = await fetch(`/api/tickets/${ticketId}/google-wallet`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not open Google Wallet');
      }
      if (!data.saveUrl) {
        throw new Error('Google Wallet link unavailable');
      }
      window.location.href = data.saveUrl;
    } catch (e) {
      setGoogleWalletError(e instanceof Error ? e.message : 'Could not open Google Wallet');
    } finally {
      setGoogleWalletBusy(false);
    }
  }, [ticketId]);

  const appleWalletHref = `/api/tickets/${ticketId}/wallet`;
  const showAppleWallet = open && qrAvailable && appleWalletEnabled && status !== 'CANCELLED';
  const showGoogleWallet = open && qrAvailable && googleWalletEnabled && status !== 'CANCELLED';

  const addToAppleWallet = useCallback(async () => {
    setAppleWalletBusy(true);
    setAppleWalletError('');
    try {
      if (inNativeApp) {
        window.location.href = appleWalletHref;
        return;
      }

      const response = await fetch(appleWalletHref, { credentials: 'same-origin' });
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        const data = contentType.includes('application/json')
          ? await response.json().catch(() => ({}))
          : {};
        throw new Error(data.error || 'Could not add to Apple Wallet');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.location.assign(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      setAppleWalletError(e instanceof Error ? e.message : 'Could not add to Apple Wallet');
    } finally {
      setAppleWalletBusy(false);
    }
  }, [appleWalletHref, inNativeApp]);

  const downloadQr = useCallback(async () => {
    const filename = `sabagiro-ticket-${ticketId.slice(-8)}.png`;
    setDownloadBusy(true);
    setError('');

    try {
      let blob: Blob | null = null;
      const passUrl = qrToken
        ? `/api/scan/${qrToken}/qr?download=1&v=7&t=${Date.now()}`
        : null;

      if (passUrl) {
        const res = await fetch(passUrl, { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) throw new Error('Could not prepare ticket image');
        blob = await res.blob();
      } else if (dataUrl) {
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }
      if (!blob) return;

      // Optional native bridge (only if already in a build that has it).
      if (inNativeApp && canNativeSaveImageToPhotos()) {
        const saved = await nativeSaveImageToPhotos(blob, filename);
        if (saved) return;
      }

      // Android WebView: no long-press save menu — share, else download, else sheet button.
      if (android) {
        if (await sharePngFile(blob, filename)) return;
        if (passUrl) {
          // Attachment → WebView DownloadListener → Downloads / gallery.
          window.location.assign(passUrl);
          return;
        }
        setPassPreviewBlob(blob);
        setPassPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob!);
        });
        return;
      }

      // iPhone: long-press image → Add to Photos.
      if (mobileSaveUi) {
        setPassPreviewBlob(blob);
        setPassPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob!);
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save ticket');
    } finally {
      setDownloadBusy(false);
    }
  }, [qrToken, dataUrl, ticketId, inNativeApp, android, mobileSaveUi]);

  const saveAndroidFromSheet = useCallback(async () => {
    if (!passPreviewBlob) return;
    const filename = `sabagiro-ticket-${ticketId.slice(-8)}.png`;
    setDownloadBusy(true);
    try {
      if (await sharePngFile(passPreviewBlob, filename)) {
        closePassPreview();
        return;
      }
      if (qrToken) {
        window.location.assign(`/api/scan/${qrToken}/qr?download=1&v=7&t=${Date.now()}`);
        closePassPreview();
      }
    } finally {
      setDownloadBusy(false);
    }
  }, [passPreviewBlob, ticketId, qrToken, closePassPreview]);

  return (
    <article
      className={`ticket-card${open ? ' ticket-card--open' : ' ticket-card--collapsed'}${qrAvailable ? '' : ' ticket-card--archived'}`}
    >
      <div className="ticket-card__summary">
        <div className="ticket-card__head">
          <h3>{productName}</h3>
          <span className={`ticket-status ticket-status--${status.toLowerCase()}`}>{status}</span>
        </div>
        <button
          type="button"
          className="btn btn--ghost ticket-card__toggle"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'Hide ticket' : 'View ticket'}
        </button>
      </div>

      {open ? (
        <div className="ticket-card__body">
          <p className="ticket-card__meta">
            Entry: {holderName} · {personalId}
          </p>
          {issuanceLine ? <p className="ticket-card__meta">{issuanceLine}</p> : null}
          {!qrAvailable ? (
            <p className="ticket-card__expired">{expiredMessage}</p>
          ) : (
            <div className="ticket-card__scan">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt="Ticket QR code"
                  className="ticket-card__qr"
                  width={200}
                  height={200}
                />
              ) : loading ? (
                <p className="ticket-card__loading">Loading QR…</p>
              ) : (
                <p className="form-error ticket-card__loading">{error || 'QR unavailable'}</p>
              )}
              {dataUrl || qrToken ? (
                <button
                  type="button"
                  className="wallet-badge"
                  onClick={downloadQr}
                  disabled={downloadBusy || (!dataUrl && !qrToken)}
                >
                  {downloadBusy
                    ? 'Preparing…'
                    : mobileSaveUi
                      ? 'Save to Photos'
                      : 'Download ticket'}
                </button>
              ) : null}
              {showAppleWallet ? (
                <button
                  type="button"
                  className="wallet-badge wallet-badge--apple"
                  onClick={addToAppleWallet}
                  disabled={appleWalletBusy}
                >
                  {appleWalletBusy ? 'Opening Apple Wallet…' : 'Add to Apple Wallet'}
                </button>
              ) : null}
              {showGoogleWallet ? (
                <button
                  type="button"
                  className="wallet-badge wallet-badge--google"
                  onClick={addToGoogleWallet}
                  disabled={googleWalletBusy}
                >
                  {googleWalletBusy ? 'Opening Google Wallet…' : 'Add to Google Wallet'}
                </button>
              ) : null}
              {googleWalletError ? (
                <p className="form-error ticket-card__wallet-error">{googleWalletError}</p>
              ) : null}
              {appleWalletError ? (
                <p className="form-error ticket-card__wallet-error">{appleWalletError}</p>
              ) : null}
              {qrToken ? (
                <a href={`/scan/${qrToken}`} className="ticket-card__link">
                  Scan link →
                </a>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {passPreviewUrl ? (
        <div
          className="ticket-save-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Save ticket to Photos"
        >
          <div className="ticket-save-sheet__panel">
            <p className="ticket-save-sheet__hint">
              {android ? (
                <>
                  Tap <strong>Save to gallery</strong> below
                </>
              ) : (
                <>
                  Long-press the image → <strong>Add to Photos</strong>
                </>
              )}
            </p>
            <img
              src={passPreviewUrl}
              alt="Sabagiro ticket"
              className="ticket-save-sheet__img"
            />
            {android ? (
              <button
                type="button"
                className="btn"
                onClick={saveAndroidFromSheet}
                disabled={downloadBusy}
              >
                {downloadBusy ? 'Saving…' : 'Save to gallery'}
              </button>
            ) : null}
            <button type="button" className="btn btn--ghost" onClick={closePassPreview}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
