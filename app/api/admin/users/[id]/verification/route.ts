import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verificationStatusSchema } from '@/lib/validators';

type Params = { params: { id: string } };

const bodySchema = z.object({
  status: verificationStatusSchema,
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { status } = bodySchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
