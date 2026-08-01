import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { buildAnalyticsHeadHtml, buildHomepageSeoHeadHtml, isNativeAppRequest } from '@/lib/analytics';
import { getHomepageEventsPayload } from '@/lib/homepage-events';
import { serializeJsonForHtmlScript } from '@/lib/html-json';

const INLINE_EVENTS_PATTERN =
  /(<script type="application\/json" id="homepage-events-data">)[\s\S]*?(<\/script>)/;

/** Serves the brutalist fullscreen homepage from public/index.html */
export async function GET(request: Request) {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  let html = await readFile(filePath, 'utf-8');

  try {
    const payload = await getHomepageEventsPayload();
    html = html.replace(
      INLINE_EVENTS_PATTERN,
      `$1${serializeJsonForHtmlScript(payload)}$2`,
    );
  } catch (e) {
    console.error('[homepage] live events inject failed', e);
  }

  const inNativeApp = isNativeAppRequest(request.headers.get('user-agent'));
  const headExtras = [
    buildHomepageSeoHeadHtml(),
    buildAnalyticsHeadHtml({ inNativeApp }),
  ]
    .filter(Boolean)
    .join('\n');
  if (headExtras) {
    html = html.replace('</head>', `${headExtras}\n</head>`);
  }
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
