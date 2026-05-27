import QRCode from 'qrcode';

export function scanUrl(qrToken: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  return `${base.replace(/\/$/, '')}/scan/${qrToken}`;
}

export async function qrDataUrl(qrToken: string) {
  return QRCode.toDataURL(scanUrl(qrToken), {
    margin: 1,
    width: 280,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
}
