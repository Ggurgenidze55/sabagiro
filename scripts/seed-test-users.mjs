/**
 * Creates fixed test accounts for local / staging.
 * Run: npm run seed:test (requires DATABASE_URL)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accounts = [
  {
    email: 'admin@sabagiro.test',
    password: 'SabagiroAdmin2026!',
    phone: '+995555000001',
    firstName: 'Nika',
    lastName: 'Admin',
    personalId: '60001000001',
    role: 'ADMIN',
    facebookUrl: 'https://facebook.com/sabagiro.admin',
    instagramUrl: 'https://instagram.com/sabagiro',
    verificationStatus: 'VERIFIED',
  },
  {
    email: 'user@sabagiro.test',
    password: 'SabagiroUser2026!',
    phone: '+995555000002',
    firstName: 'Ana',
    lastName: 'Guest',
    personalId: '60001000002',
    role: 'USER',
    facebookUrl: 'https://facebook.com/sabagiro.user',
    instagramUrl: 'https://instagram.com/sabagiro',
    verificationStatus: 'VERIFIED',
  },
];

console.log('\n--- Sabagiro test accounts ---\n');

for (const acc of accounts) {
  const passwordHash = await bcrypt.hash(acc.password, 12);
  const user = await prisma.user.upsert({
    where: { email: acc.email },
    update: {
      passwordHash,
      phone: acc.phone,
      firstName: acc.firstName,
      lastName: acc.lastName,
      personalId: acc.personalId,
      role: acc.role,
      facebookUrl: acc.facebookUrl,
      instagramUrl: acc.instagramUrl,
      verificationStatus: acc.verificationStatus,
      verifiedAt: acc.verificationStatus === 'VERIFIED' ? new Date() : null,
    },
    create: {
      email: acc.email,
      passwordHash,
      phone: acc.phone,
      firstName: acc.firstName,
      lastName: acc.lastName,
      personalId: acc.personalId,
      role: acc.role,
      facebookUrl: acc.facebookUrl,
      instagramUrl: acc.instagramUrl,
      verificationStatus: acc.verificationStatus,
      verifiedAt: acc.verificationStatus === 'VERIFIED' ? new Date() : null,
    },
  });

  console.log(`${acc.role === 'ADMIN' ? 'ADMIN ' : 'USER '} ${user.email}`);
  console.log(`       password: ${acc.password}`);
  console.log(`       panel:    ${acc.role === 'ADMIN' ? '/admin' : '/account'}\n`);
}

await prisma.$disconnect();
