/**
 * Verified demo account for Apple App Store review.
 * Run: dotenv -e .env.local -e .env -- tsx scripts/seed-appstore-review-user.mjs
 *
 * Env (optional):
 *   APPSTORE_REVIEW_EMAIL
 *   APPSTORE_REVIEW_PASSWORD  — if omitted, a random password is generated and printed
 */
import { createPrismaClient } from './prisma-client.ts';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const { prisma, pool } = createPrismaClient();

const email = (process.env.APPSTORE_REVIEW_EMAIL || 'appstore.review@sabagiro.ge').trim().toLowerCase();
const password =
  process.env.APPSTORE_REVIEW_PASSWORD?.trim() ||
  `SbReview-${crypto.randomBytes(4).toString('hex')}!`;
const phone = process.env.APPSTORE_REVIEW_PHONE || '+995555000001';
const firstName = process.env.APPSTORE_REVIEW_FIRST_NAME || 'App Store';
const lastName = process.env.APPSTORE_REVIEW_LAST_NAME || 'Reviewer';
const personalId = process.env.APPSTORE_REVIEW_PERSONAL_ID || '11111111111';
const instagramUrl =
  process.env.APPSTORE_REVIEW_INSTAGRAM || 'https://instagram.com/sabagirolisi';

const hash = await bcrypt.hash(password, 12);

const user = await prisma.user.upsert({
  where: { email },
  update: {
    firstName,
    lastName,
    phone,
    personalId,
    passwordHash: hash,
    role: 'USER',
    verificationStatus: 'VERIFIED',
    facebookUrl: '',
    instagramUrl,
    ticketLimitPerEvent: 2,
    freeTicketsEnabled: false,
    doorScanEnabled: false,
  },
  create: {
    email,
    phone,
    firstName,
    lastName,
    personalId,
    passwordHash: hash,
    role: 'USER',
    verificationStatus: 'VERIFIED',
    facebookUrl: '',
    instagramUrl,
    ticketLimitPerEvent: 2,
    freeTicketsEnabled: false,
  },
});

console.log('\nApp Store review account ready:\n');
console.log('  Email:   ', user.email);
console.log('  Password:', password);
console.log('  Status:  ', user.verificationStatus);
console.log('\nPaste these into App Store Connect → App Review Information → Sign-in required.\n');

await prisma.$disconnect();
await pool.end();
