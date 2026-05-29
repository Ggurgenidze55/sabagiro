import { NextResponse } from 'next/server';
import { isAppleWalletConfigured } from '@/lib/wallet/apple-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ appleWallet: isAppleWalletConfigured() });
}
