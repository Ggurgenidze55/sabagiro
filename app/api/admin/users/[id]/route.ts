import { NextResponse } from 'next/server';
import { requireUserManager } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUserManagerActOnTarget } from '@/lib/staff-roles';

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const actor = await requireUserManager();

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canUserManagerActOnTarget(actor.role, target.role)) {
      return NextResponse.json({ error: 'Cannot delete this account' }, { status: 403 });
    }

    if (target.id === actor.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: target.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
