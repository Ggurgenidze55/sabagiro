import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clearSessionCookie, requireUser, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirm: z.literal('DELETE'),
});

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = deleteAccountSchema.parse(await request.json());

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { id: true, passwordHash: true },
    });

    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Password is wrong' }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: user.id } });
    await clearSessionCookie();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
