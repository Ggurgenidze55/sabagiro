import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAppleWalletConfigured } from '@/lib/wallet/apple-config';
import { buildAppleWalletPass } from '@/lib/wallet/apple-pass';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    if (!isAppleWalletConfigured()) {
      return NextResponse.json(
        { error: 'Apple Wallet is not configured yet. Contact Sabagiro support.' },
        { status: 503 },
      );
    }

    const session = await requireUser();
    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, userId: session.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This ticket is cancelled' }, { status: 410 });
    }

    const buffer = await buildAppleWalletPass(ticket);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="sabagiro-${ticket.id.slice(-8)}.pkpass"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }
    if (message === 'APPLE_WALLET_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Apple Wallet not configured' }, { status: 503 });
    }
    console.error('[wallet]', message, e);
    return NextResponse.json({ error: 'Could not create wallet pass' }, { status: 500 });
  }
}
