import { NextResponse } from 'next/server';
import { canUseGoogleWallet } from '@/lib/google-wallet-device';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isGoogleWalletConfigured } from '@/lib/wallet/google-config';
import { buildGoogleWalletSaveUrl } from '@/lib/wallet/google-pass';
import { qrExpiredMessage, loadTicketQrContext } from '@/lib/ticket-qr-access';
import { assertTicketQrAccess } from '@/lib/ticket-qr-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const userAgent = request.headers.get('user-agent') ?? '';
    if (!canUseGoogleWallet(userAgent)) {
      return NextResponse.json(
        { error: 'Google Wallet is only available on Android.' },
        { status: 403 },
      );
    }

    if (!isGoogleWalletConfigured()) {
      return NextResponse.json(
        { error: 'Google Wallet is not configured yet. Contact Sabagiro support.' },
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

    const ctx = await loadTicketQrContext(ticket, async (slug) => {
      const event = await prisma.clubEvent.findFirst({
        where: { slug },
        select: { eventDate: true },
      });
      return event?.eventDate;
    });

    try {
      assertTicketQrAccess(ctx, session.role === 'ADMIN');
    } catch (e) {
      if (e instanceof Error && e.message === 'QR_EXPIRED') {
        return NextResponse.json({ error: qrExpiredMessage(), code: 'QR_EXPIRED' }, { status: 410 });
      }
      throw e;
    }

    const saveUrl = await buildGoogleWalletSaveUrl(ticket);

    return NextResponse.json({ saveUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }
    if (message === 'GOOGLE_WALLET_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Google Wallet not configured' }, { status: 503 });
    }
    console.error('[google-wallet]', message, e);
    return NextResponse.json({ error: 'Could not create Google Wallet pass' }, { status: 500 });
  }
}
