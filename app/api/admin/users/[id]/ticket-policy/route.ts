import { NextResponse } from 'next/server';
import { requireUserManager } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchEmail, type EmailDispatchMeta } from '@/lib/email/dispatch';
import { sendFreeTicketsEnabledEmail } from '@/lib/email/send';
import { isProtectedStaffTarget } from '@/lib/staff-roles';
import { formatValidationError, ticketPolicySchema } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireUserManager();
    const body = ticketPolicySchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (isProtectedStaffTarget(existing.role)) {
      return NextResponse.json({ error: 'Cannot change policy for admin' }, { status: 403 });
    }

    if (body.freeTicketsEnabled && body.freeTicketsQuota < 1) {
      return NextResponse.json(
        { error: 'Free ticket quota must be at least 1 when generation is enabled.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ticketLimitPerEvent: body.ticketLimitPerEvent,
        freeTicketsEnabled: body.freeTicketsEnabled,
        freeTicketsQuota: body.freeTicketsEnabled ? body.freeTicketsQuota : 0,
      },
    });

    let email: EmailDispatchMeta | null = null;
    const freeJustEnabled =
      body.freeTicketsEnabled &&
      body.freeTicketsQuota >= 1 &&
      (!existing.freeTicketsEnabled || existing.freeTicketsQuota < 1);

    if (freeJustEnabled && user.verificationStatus === 'VERIFIED') {
      email = await dispatchEmail('admin:free-tickets', () =>
        sendFreeTicketsEnabledEmail({
          to: user.email,
          firstName: user.firstName,
          quota: user.freeTicketsQuota,
        }),
      );
    }

    return NextResponse.json({ user, email });
  } catch (e) {
    const message =
      e instanceof Error && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')
        ? e.message
        : formatValidationError(e);
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
