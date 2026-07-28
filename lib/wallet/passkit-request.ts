import { getAppleWalletConfig } from '@/lib/wallet/apple-config';
import { verifyWalletPassAuth } from '@/lib/wallet/pass-auth';

export function readApplePassAuth(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^ApplePass\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authorizePasskitRequest(serialNumber: string, request: Request) {
  const token = readApplePassAuth(request);
  if (!(await verifyWalletPassAuth(serialNumber, token))) {
    return false;
  }
  const { passTypeIdentifier } = getAppleWalletConfig();
  return true;
}

export function passkitPassTypeId(): string {
  return getAppleWalletConfig().passTypeIdentifier;
}
