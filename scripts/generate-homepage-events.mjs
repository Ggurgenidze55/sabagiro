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
import { createPrismaClient } from './prisma-client.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const marker = '<!-- SABAGIRO_EVENTS_SNAPSHOT -->';
const indexPath = join(root, 'public', 'index.html');
const snapshotPath = join(root, 'public', 'events.snapshot.json');

const { prisma, pool } = createPrismaClient();

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
    isFreeEntry: e.isFreeEntry,
    shopUrl: `/events/${encodeURIComponent(e.slug)}`,
  }));
}

function sortPublishedEvents(events) {
  return [...events].sort((a, b) => {
    const byCreated = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (byCreated !== 0) return byCreated;
    const dateA = a.eventDate ? Date.parse(a.eventDate) : NaN;
    const dateB = b.eventDate ? Date.parse(b.eventDate) : NaN;
    if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateA - dateB;
    if (!Number.isNaN(dateA) && Number.isNaN(dateB)) return -1;
    if (Number.isNaN(dateA) && !Number.isNaN(dateB)) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
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

  const [rawEvents, seasonRow] = await Promise.all([
    prisma.clubEvent.findMany({
      where: { published: true },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'events_season' } }),
  ]);

  const events = sortPublishedEvents(rawEvents);

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

  const embedJson = (html) => {
    if (html.includes(marker)) {
      return html.replace(marker, json);
    }
    const inlinePattern =
      /(<script type="application\/json" id="homepage-events-data">)[\s\S]*?(<\/script>)/;
    if (inlinePattern.test(html)) {
      return html.replace(inlinePattern, `$1${json}$2`);
    }
    return null;
  };

  for (const relPath of ['public/index.html', 'public/index.full.html']) {
    const filePath = join(root, relPath);
    let html = readFileSync(filePath, 'utf8');
    const next = embedJson(html);
    if (!next) {
      console.warn(`[homepage-events] no embed target in ${relPath}`);
      continue;
    }
    writeFileSync(filePath, next, 'utf8');
    console.log(`[homepage-events] embedded snapshot in ${relPath}`);
  }
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('[homepage-events] failed', e);
  process.exit(1);
});
