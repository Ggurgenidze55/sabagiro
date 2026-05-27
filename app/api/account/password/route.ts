import { NextResponse } from 'next/server';
import { hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { passwordSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = passwordSchema.parse(await request.json());
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'Current password is wrong' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
