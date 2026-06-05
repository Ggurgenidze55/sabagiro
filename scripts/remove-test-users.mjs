/** Remove @sabagiro.test accounts from DB. Run: node scripts/remove-test-users.mjs */
import { readFileSync } from 'node:fs';
import { createPrismaClient } from './prisma-client.ts';

function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

loadEnvLocal();
const { prisma, pool } = createPrismaClient();
const TEST_EMAILS = ['user@sabagiro.test', 'admin@sabagiro.test'];

for (const email of TEST_EMAILS) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.delete({ where: { email } });
    console.log('Deleted:', email);
  } else {
    console.log('Not found:', email);
  }
}

const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
console.log('Admins left:', admins.map((a) => a.email).join(', '));
await prisma.$disconnect();
await pool.end();
