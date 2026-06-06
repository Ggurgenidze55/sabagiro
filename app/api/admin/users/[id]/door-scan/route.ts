import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { doorScanSchema, formatValidationError } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = doorScanSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (existing.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts always have door scan access' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { doorScanEnabled: body.enabled },
      select: { id: true, doorScanEnabled: true },
    });

    return NextResponse.json({ ok: true, doorScanEnabled: user.doorScanEnabled });
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
