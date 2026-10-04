import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizePromoCodeInput } from '@/lib/promo-codes';
import { formatValidationError, promoCodeAdminSchema } from '@/lib/validators';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ promoCodes: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = promoCodeAdminSchema.parse(await request.json());
    const code = normalizePromoCodeInput(body.code);
    const event = await prisma.clubEvent.findFirst({ where: { slug: body.eventSlug } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const expiresAt =
      body.expiresAt === null || body.expiresAt === undefined
        ? null
        : new Date(body.expiresAt);

    const row = await prisma.promoCode.create({
      data: {
        code,
        percentOff: body.percentOff,
        eventSlug: body.eventSlug,
        active: body.active ?? true,
        maxUses: body.maxUses ?? null,
        expiresAt,
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
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (String(message).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
