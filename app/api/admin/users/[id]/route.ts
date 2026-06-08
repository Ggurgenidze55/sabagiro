import { NextResponse } from 'next/server';
import { requireAdmin, requireUserManager } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isProtectedStaffTarget, isStaffRole } from '@/lib/staff-roles';

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

    if (isProtectedStaffTarget(target.role)) {
      return NextResponse.json({ error: 'Cannot delete an admin account' }, { status: 403 });
    }

    if (isStaffRole(target.role) && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can delete staff accounts' }, { status: 403 });
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
