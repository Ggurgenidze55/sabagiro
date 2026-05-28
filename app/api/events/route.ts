import { NextResponse } from 'next/server';
import { getHomepageEventsPayload } from '@/lib/homepage-events';

export const runtime = 'nodejs';
/** CDN cache — homepage also embeds a build-time snapshot for instant paint. */
export const revalidate = 60;

export async function GET() {
  const payload = await getHomepageEventsPayload();
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
