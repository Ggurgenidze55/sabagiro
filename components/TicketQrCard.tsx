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
  const [error, setError] = useState('');
  const inNativeApp = isSabagiroAppShell();

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
        ? `/api/scan/${qrToken}/qr?download=1&v=5&t=${Date.now()}`
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

      // Native apps: write straight into Photos / Gallery (no Files share sheet).
      if (inNativeApp && canNativeSaveImageToPhotos()) {
        const saved = await nativeSaveImageToPhotos(blob, filename);
        if (saved) return;
      }

      if (!inNativeApp) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        return;
      }

      // Older app builds without the Photos bridge — open image for long-press save.
      if (passUrl) {
        window.location.assign(`${passUrl}&inline=1`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save ticket');
    } finally {
      setDownloadBusy(false);
    }
  }, [qrToken, dataUrl, ticketId, inNativeApp]);

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
                    ? 'Saving…'
                    : inNativeApp
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
    </article>
  );
}
