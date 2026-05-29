import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** One-time setup: creates admin from env when no ADMIN exists. */
export async function POST() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin already exists. Use /login.' }, { status: 403 });
    }

    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Set ADMIN_EMAIL and ADMIN_PASSWORD on the server, then retry.' },
        { status: 400 },
      );
    }

    const phone = process.env.ADMIN_PHONE?.trim() || '+995500000000';
    const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Sabagiro';
    const personalId = process.env.ADMIN_PERSONAL_ID?.trim() || '00000000000';

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        phone,
        firstName,
        lastName,
        personalId,
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        email,
        passwordHash,
        phone,
        firstName,
        lastName,
        personalId,
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      email: user.email,
      login: `${process.env.APP_URL || 'https://www.sabagiro.ge'}/login`,
      panel: `${process.env.APP_URL || 'https://www.sabagiro.ge'}/admin`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bootstrap failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
