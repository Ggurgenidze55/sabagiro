import { NextResponse } from 'next/server';
import type { Role } from '@/generated/prisma/client';
import { requireRoleAssigner } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchEmail, type EmailDispatchMeta } from '@/lib/email/dispatch';
import { sendStaffRoleChangedEmail } from '@/lib/email/send';
import { canAssignRoleToTarget, roleLabel } from '@/lib/staff-roles';
import { assignStaffRoleSchema, formatValidationError } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requireRoleAssigner();
    const body = assignStaffRoleSchema.parse(await request.json());

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canAssignRoleToTarget(actor.role, target.role)) {
      return NextResponse.json({ error: 'Cannot change this account role' }, { status: 403 });
    }

    if (target.id === actor.id && body.role !== actor.role) {
      return NextResponse.json({ error: 'Cannot change your own staff role here' }, { status: 403 });
    }

    const previousRole = target.role;
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role: body.role as Role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    let email: EmailDispatchMeta | null = null;
    if (previousRole !== user.role) {
      email = await dispatchEmail('admin:staff-role', () =>
        sendStaffRoleChangedEmail({
          to: user.email,
          firstName: user.firstName,
          role: user.role,
          previousRole,
        }),
      );
    }

    return NextResponse.json({
      ok: true,
      user,
      roleLabel: roleLabel(user.role),
      email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json(
      { error: message === 'FORBIDDEN' ? message : formatValidationError(e) },
      { status },
    );
  }
}
