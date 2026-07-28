import { NextResponse } from 'next/server';
import { canUseAppleWallet } from '@/lib/apple-wallet-device';
import { canUseGoogleWallet } from '@/lib/google-wallet-device';
import { isAppleWalletConfigured } from '@/lib/wallet/apple-config';
import { isGoogleWalletConfigured } from '@/lib/wallet/google-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') ?? '';
  return NextResponse.json({
    appleWallet: isAppleWalletConfigured() && canUseAppleWallet(userAgent),
    googleWallet: isGoogleWalletConfigured() && canUseGoogleWallet(userAgent),
  });
}
