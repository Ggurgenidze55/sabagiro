/**
 * Replace test/old admins with production admin accounts.
 * Run: node scripts/reset-production-admins.mjs
 * Requires DATABASE_URL in .env.local
 */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createPrismaClient } from './prisma-client.ts';
import bcrypt from 'bcryptjs';

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

function genPassword() {
  const core = randomBytes(18).toString('base64url');
  return `SbG!${core}#9`;
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing — set in .env.local');
  process.exit(1);
}

const NEW_ADMINS = [
  {
    email: 'info.sabagiro@gmail.com',
    firstName: 'Sabagiro',
    lastName: 'Gmail',
    phone: '+995500000001',
    personalId: '60001001001',
  },
  {
    email: 'info@sabagiro.ge',
    firstName: 'Sabagiro',
    lastName: 'Info',
    phone: '+995500000002',
    personalId: '60001001002',
  },
];

const REMOVE_EMAILS = [
  'admin@sabagiro.test',
  'admin@sabagiro.ge',
  'user@sabagiro.test',
];

const { prisma, pool } = createPrismaClient();
const credentials = [];

try {
  const existingAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true },
  });
  console.log('Current admins:', existingAdmins.map((u) => u.email).join(', ') || '(none)');

  for (const email of REMOVE_EMAILS) {
    const found = await prisma.user.findUnique({ where: { email } });
    if (found) {
      await prisma.user.delete({ where: { email } });
      console.log('Deleted:', email);
    }
  }

  const keep = new Set(NEW_ADMINS.map((a) => a.email));
  for (const admin of existingAdmins) {
    if (!keep.has(admin.email) && !REMOVE_EMAILS.includes(admin.email)) {
      await prisma.user.delete({ where: { email: admin.email } });
      console.log('Deleted extra admin:', admin.email);
    }
  }

  for (const acc of NEW_ADMINS) {
    const password = genPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash,
        role: 'ADMIN',
        phone: acc.phone,
        firstName: acc.firstName,
        lastName: acc.lastName,
        personalId: acc.personalId,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagirolisi',
      },
      create: {
        email: acc.email,
        passwordHash,
        role: 'ADMIN',
        phone: acc.phone,
        firstName: acc.firstName,
        lastName: acc.lastName,
        personalId: acc.personalId,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagirolisi',
      },
    });
    credentials.push({ email: acc.email, password });
    console.log('Admin ready:', acc.email);
  }

  console.log('\n--- New admin credentials (save now — not stored in git) ---\n');
  for (const c of credentials) {
    console.log(`${c.email}`);
    console.log(`  password: ${c.password}`);
    console.log(`  login:    https://www.sabagiro.ge/login\n`);
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
