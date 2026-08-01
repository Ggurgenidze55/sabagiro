import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getHomepageEventsPayload } from '@/lib/homepage-events';
import { serializeJsonForHtmlScript } from '@/lib/html-json';

const INLINE_PATTERN =
  /(<script type="application\/json" id="homepage-events-data">)[\s\S]*?(<\/script>)/;

/** Refresh public snapshot + embedded homepage JSON from live DB (after admin event changes). */
export async function regenerateHomepageEventsSnapshot() {
  const root = process.cwd();
  const payload = await getHomepageEventsPayload();
  const json = JSON.stringify(payload);
  const embedJson = serializeJsonForHtmlScript(payload);

  writeFileSync(path.join(root, 'public', 'events.snapshot.json'), `${json}\n`, 'utf8');

  for (const rel of ['public/index.html', 'public/index.full.html']) {
    const filePath = path.join(root, rel);
    let html = readFileSync(filePath, 'utf8');
    if (!INLINE_PATTERN.test(html)) continue;
    html = html.replace(INLINE_PATTERN, `$1${embedJson}$2`);
    writeFileSync(filePath, html, 'utf8');
  }

  return payload;
}
