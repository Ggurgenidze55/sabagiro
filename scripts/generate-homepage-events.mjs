/**
 * Embeds upcoming events into public/index.html + writes events.snapshot.json
 * so the static homepage renders instantly (no wait on /api/events cold start).
 *
 * Run: node scripts/generate-homepage-events.mjs
 * Wired into `npm run build` (needs DATABASE_URL on Vercel).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const marker = '<!-- SABAGIRO_EVENTS_SNAPSHOT -->';
const indexPath = join(root, 'public', 'index.html');
const snapshotPath = join(root, 'public', 'events.snapshot.json');

const prisma = new PrismaClient();

function mapEvents(events) {
  return events.map((e) => ({
    slug: e.slug,
    title: e.title,
    lineup: e.lineup,
    tag: e.tag,
    dayLabel: e.dayLabel,
    dateLabel: e.dateLabel,
    accent: e.accent,
    isFeatured: e.isFeatured,
    shopUrl: `/shop/${encodeURIComponent(e.slug)}`,
  }));
}

async function loadPayload() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn('[homepage-events] DATABASE_URL missing — keeping previous snapshot if any');
    try {
      return JSON.parse(readFileSync(snapshotPath, 'utf8'));
    } catch {
      return { season: 'Summer 2025', events: [] };
    }
  }

  const [events, seasonRow] = await Promise.all([
    prisma.clubEvent.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.siteSetting.findUnique({ where: { key: 'events_season' } }),
  ]);

  return {
    season: seasonRow?.value || 'Summer 2025',
    events: mapEvents(events),
  };
}

async function main() {
  const payload = await loadPayload();
  const json = JSON.stringify(payload);

  writeFileSync(snapshotPath, `${json}\n`, 'utf8');
  console.log(`[homepage-events] wrote ${snapshotPath} (${payload.events.length} events)`);

  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes(marker)) {
    console.warn('[homepage-events] marker not found in index.html — skip inline embed');
    await prisma.$disconnect();
    return;
  }

  html = html.replace(marker, json);
  writeFileSync(indexPath, html, 'utf8');
  console.log('[homepage-events] embedded snapshot in public/index.html');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[homepage-events] failed', e);
  process.exit(1);
});
