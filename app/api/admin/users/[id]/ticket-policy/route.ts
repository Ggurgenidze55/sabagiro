import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatValidationError, ticketPolicySchema } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = ticketPolicySchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (existing.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot change policy for admin' }, { status: 403 });
    }

    if (body.freeTicketsQuota < existing.freeTicketsUsed) {
      return NextResponse.json(
        {
          error: `Free ticket quota cannot be lower than ${existing.freeTicketsUsed} (already used).`,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ticketLimitPerEvent: body.ticketLimitPerEvent,
        freeTicketsEnabled: body.freeTicketsEnabled,
        freeTicketsQuota: body.freeTicketsQuota,
      },
    });

    return NextResponse.json({ user });
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
