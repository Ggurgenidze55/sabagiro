import { NextResponse } from 'next/server';
import { getHomepageEventsPayload } from '@/lib/homepage-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const payload = await getHomepageEventsPayload();
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
