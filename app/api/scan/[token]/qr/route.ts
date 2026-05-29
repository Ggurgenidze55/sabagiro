import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { qrPngBuffer } from '@/lib/qr';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: { token: string } };

/** Public QR PNG for ticket emails (token is the secret). */
export async function GET(_request: Request, { params }: Params) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      qrToken: params.token,
      status: { not: 'CANCELLED' },
    },
    select: { id: true },
  });

  if (!ticket) {
    return new NextResponse('Not found', { status: 404 });
  }

  const png = await qrPngBuffer(params.token);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
