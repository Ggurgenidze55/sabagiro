import { NextResponse } from 'next/server';
import { getSessionUser, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { profileUpdateSchema } from '@/lib/validators';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = profileUpdateSchema.parse(await request.json());

    if (body.email !== session.email) {
      const taken = await prisma.user.findUnique({ where: { email: body.email } });
      if (taken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        email: body.email,
        phone: body.phone,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
