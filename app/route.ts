import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { buildAnalyticsHeadHtml, buildHomepageSeoHeadHtml } from '@/lib/analytics';

/** Serves the brutalist fullscreen homepage from public/index.html */
export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  let html = await readFile(filePath, 'utf-8');
  const headExtras = [buildHomepageSeoHeadHtml(), buildAnalyticsHeadHtml()].filter(Boolean).join('\n');
  if (headExtras) {
    html = html.replace('</head>', `${headExtras}\n</head>`);
  }
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
