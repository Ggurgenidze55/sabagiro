import { createPrismaClient } from './prisma-client.ts';
import bcrypt from 'bcryptjs';

const { prisma, pool } = createPrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const phone = process.env.ADMIN_PHONE || '+995500000000';
const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
const lastName = process.env.ADMIN_LAST_NAME || 'Sabagiro';
const personalId = process.env.ADMIN_PERSONAL_ID || '00000000000';

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const user = await prisma.user.upsert({
  where: { email },
  update: { role: 'ADMIN', passwordHash: hash },
  create: {
    email,
    phone,
    firstName,
    lastName,
    personalId,
    passwordHash: hash,
    role: 'ADMIN',
  },
});

console.log('Admin ready:', user.email);
await prisma.$disconnect();
await pool.end();
