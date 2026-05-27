import { NextResponse } from 'next/server';
import { setSessionCookie, toSessionUser, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { zodErrorMessage } from '@/lib/zod-error';
import { loginSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setSessionCookie(toSessionUser(user));
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    return NextResponse.json({ error: zodErrorMessage(e) }, { status: 400 });
  }
}
