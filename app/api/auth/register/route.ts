import { NextResponse } from 'next/server';
import { hashPassword, setSessionCookie, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        personalId: body.personalId,
        passwordHash: await hashPassword(body.password),
        role: 'USER',
      },
    });

    await setSessionCookie(toSessionUser(user));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
