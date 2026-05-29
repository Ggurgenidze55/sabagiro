import QRCode from 'qrcode';
import { siteUrl } from '@/lib/site-url';

export function scanUrl(qrToken: string) {
  return siteUrl(`/scan/${qrToken}`);
}

export function qrImageUrl(qrToken: string) {
  return siteUrl(`/api/scan/${qrToken}/qr`);
}

export async function qrDataUrl(qrToken: string) {
  return QRCode.toDataURL(scanUrl(qrToken), {
    margin: 1,
    width: 280,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
}

export async function qrPngBase64(qrToken: string) {
  const buf = await qrPngBuffer(qrToken);
  return buf.toString('base64');
}

export async function qrPngBuffer(qrToken: string) {
  return QRCode.toBuffer(scanUrl(qrToken), {
    margin: 1,
    width: 280,
    type: 'png',
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
}
