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

function publicTicketUrl(qrToken: string) {
  if (typeof window === 'undefined') return `/t/${encodeURIComponent(qrToken)}`;
  return `${window.location.origin}/t/${encodeURIComponent(qrToken)}`;
}

/** Share a clean https ticket link (never blob:) — opens for guests without login. */
async function shareTicketLink(qrToken: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = publicTicketUrl(qrToken);
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ title, text: title, url });
      return 'shared';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'shared';
    }
  }
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    /* ignore */
  }
  return 'failed';
}

/** iOS share sheet shows “Save Image” only when sharing a File (no url/blob link). */
async function shareImageFileForPhotos(blob: Blob, filename: string): Promise<boolean> {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav || typeof nav.share !== 'function') return false;
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    const payload: ShareData = { files: [file] };
    if (typeof nav.canShare === 'function' && !nav.canShare(payload)) return false;
    await nav.share(payload);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return true;
    return false;
  }
}

function absolutePassUrl(qrToken: string, opts?: { attachment?: boolean }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const q = opts?.attachment
    ? `download=1&v=9&t=${Date.now()}`
    : `download=1&inline=1&v=9&t=${Date.now()}`;
  return `${origin}/api/scan/${encodeURIComponent(qrToken)}/qr?${q}`;
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
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNote, setShareNote] = useState('');
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
    // App shell: save/download disabled — use Share ticket link only.
    if (inNativeApp) return;

    const filename = `sabagiro-ticket-${ticketId.slice(-8)}.png`;
    setDownloadBusy(true);
    setError('');

    try {
      if (!qrToken && !dataUrl) return;

      let blob: Blob | null = null;
      if (qrToken) {
        const res = await fetch(absolutePassUrl(qrToken, { attachment: android }), {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) throw new Error('Could not prepare ticket image');
        blob = await res.blob();
      } else if (dataUrl) {
        blob = await (await fetch(dataUrl)).blob();
      }
      if (!blob) return;

      if (inNativeApp && canNativeSaveImageToPhotos()) {
        const saved = await nativeSaveImageToPhotos(blob, filename);
        if (saved) return;
      }

      // Best web path for Photos: share the PNG file (iOS sheet → Save Image).
      if (mobileSaveUi && (await shareImageFileForPhotos(blob, filename))) {
        return;
      }

      // Android fallback: trigger WebView download.
      if (android && qrToken) {
        window.location.assign(absolutePassUrl(qrToken, { attachment: true }));
        return;
      }

      // iPhone fallback: full-screen https image → long-press Add to Photos.
      if (mobileSaveUi && qrToken) {
        const httpsUrl = absolutePassUrl(qrToken, { attachment: false });
        setPassPreviewBlob(blob);
        setPassPreviewUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return httpsUrl;
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

  const saveImageFromSheet = useCallback(async () => {
    if (!qrToken && !passPreviewBlob) return;
    const filename = `sabagiro-ticket-${ticketId.slice(-8)}.png`;
    setDownloadBusy(true);
    try {
      let blob = passPreviewBlob;
      if (!blob && qrToken) {
        const res = await fetch(absolutePassUrl(qrToken, { attachment: false }), {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) throw new Error('Could not prepare ticket image');
        blob = await res.blob();
      }
      if (!blob) return;

      if (await shareImageFileForPhotos(blob, filename)) {
        closePassPreview();
        return;
      }
      if (android && qrToken) {
        window.location.assign(absolutePassUrl(qrToken, { attachment: true }));
        closePassPreview();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save ticket');
    } finally {
      setDownloadBusy(false);
    }
  }, [qrToken, passPreviewBlob, ticketId, android, closePassPreview]);

  const shareTicket = useCallback(async () => {
    if (!qrToken) return;
    setShareBusy(true);
    setShareNote('');
    try {
      const result = await shareTicketLink(qrToken, `${productName} — Sabagiro ticket`);
      if (result === 'copied') setShareNote('Link copied');
      if (result === 'failed') setShareNote('Could not share link');
    } finally {
      setShareBusy(false);
    }
  }, [qrToken, productName]);

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
              {/* In-app WebView: no save/download — share link only. Web browsers keep download. */}
              {!inNativeApp && (dataUrl || qrToken) ? (
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
              {qrToken ? (
                <button
                  type="button"
                  className="wallet-badge"
                  onClick={shareTicket}
                  disabled={shareBusy}
                >
                  {shareBusy ? 'Sharing…' : 'Share ticket link'}
                </button>
              ) : null}
              {shareNote ? <p className="ticket-card__meta">{shareNote}</p> : null}
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
              Tap <strong>Save Image</strong>, then choose <strong>Save Image</strong> / Photos
              <br />
              or press and hold the picture → <strong>Add to Photos</strong>
            </p>
            <img
              src={passPreviewUrl}
              alt="Sabagiro ticket"
              className="ticket-save-sheet__img"
            />
            <button
              type="button"
              className="btn"
              onClick={saveImageFromSheet}
              disabled={downloadBusy}
            >
              {downloadBusy ? 'Saving…' : 'Save Image'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={closePassPreview}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
