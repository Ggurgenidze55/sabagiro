import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizePromoCodeInput } from '@/lib/promo-codes';
import { formatValidationError, promoCodeAdminSchema } from '@/lib/validators';

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const body = promoCodeAdminSchema.partial().parse(await request.json());
    const existing = await prisma.promoCode.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.eventSlug) {
      const event = await prisma.clubEvent.findFirst({ where: { slug: body.eventSlug } });
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
    }

    let code: string | undefined;
    if (body.code !== undefined) {
      code = normalizePromoCodeInput(body.code);
      const taken = await prisma.promoCode.findFirst({
        where: { code, NOT: { id: params.id } },
      });
      if (taken) {
        return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
      }
    }

    const expiresAt =
      body.expiresAt === null
        ? null
        : body.expiresAt === undefined
          ? undefined
          : new Date(body.expiresAt);

    const row = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(body.percentOff !== undefined ? { percentOff: body.percentOff } : {}),
        ...(body.eventSlug !== undefined ? { eventSlug: body.eventSlug } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.maxUses !== undefined ? { maxUses: body.maxUses } : {}),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
      },
    });
    return NextResponse.json({ promoCode: row });
  } catch (e) {
    const message =
      e instanceof Error && e.name === 'ZodError'
        ? formatValidationError(e)
        : e instanceof Error
          ? e.message
          : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.promoCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
