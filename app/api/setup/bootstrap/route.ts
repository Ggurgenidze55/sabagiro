import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_ADMIN = {
  email: 'admin@sabagiro.test',
  password: 'SabagiroAdmin2026!',
  phone: '+995555000001',
  firstName: 'Nika',
  lastName: 'Admin',
  personalId: '60001000001',
};

const DEFAULT_USER = {
  email: 'user@sabagiro.test',
  password: 'SabagiroUser2026!',
  phone: '+995555000002',
  firstName: 'Ana',
  lastName: 'Guest',
  personalId: '60001000002',
};

/** One-time setup: ensures admin + test user when no ADMIN exists yet. */
export async function POST() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin already exists. Use /login.' }, { status: 403 });
    }

    const adminHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    const userHash = await bcrypt.hash(DEFAULT_USER.password, 12);

    await prisma.user.upsert({
      where: { email: DEFAULT_ADMIN.email },
      update: {
        passwordHash: adminHash,
        phone: DEFAULT_ADMIN.phone,
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
        personalId: DEFAULT_ADMIN.personalId,
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagiro',
      },
      create: {
        email: DEFAULT_ADMIN.email,
        passwordHash: adminHash,
        phone: DEFAULT_ADMIN.phone,
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
        personalId: DEFAULT_ADMIN.personalId,
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagiro',
      },
    });

    await prisma.user.upsert({
      where: { email: DEFAULT_USER.email },
      update: {
        passwordHash: userHash,
        phone: DEFAULT_USER.phone,
        firstName: DEFAULT_USER.firstName,
        lastName: DEFAULT_USER.lastName,
        personalId: DEFAULT_USER.personalId,
        role: 'USER',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagiro',
      },
      create: {
        email: DEFAULT_USER.email,
        passwordHash: userHash,
        phone: DEFAULT_USER.phone,
        firstName: DEFAULT_USER.firstName,
        lastName: DEFAULT_USER.lastName,
        personalId: DEFAULT_USER.personalId,
        role: 'USER',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        facebookUrl: 'https://facebook.com/sabagiro',
        instagramUrl: 'https://instagram.com/sabagiro',
      },
    });

    return NextResponse.json({
      ok: true,
      accounts: [
        {
          role: 'ADMIN',
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          login: 'https://sabagiro.vercel.app/login',
          panel: 'https://sabagiro.vercel.app/admin',
        },
        {
          role: 'USER',
          email: DEFAULT_USER.email,
          password: DEFAULT_USER.password,
          panel: 'https://sabagiro.vercel.app/account',
        },
      ],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bootstrap failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
