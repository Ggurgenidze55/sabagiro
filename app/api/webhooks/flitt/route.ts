import { NextResponse } from 'next/server';
import { handleFlittCallback } from '@/lib/payments/complete-payment';
import { parseFlittPayload, verifyFlittCallback } from '@/lib/payments/flitt/callback';

export const runtime = 'nodejs';

/** Flitt server_callback_url — https://docs.flitt.com/api/callbacks/ */
export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = parseFlittPayload(body);
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';

  const verified = verifyFlittCallback({ payload, clientIp });
  if (!verified.valid) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  await handleFlittCallback(payload);
  return NextResponse.json({ ok: true });
}
