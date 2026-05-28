import { NextResponse } from 'next/server';
import { normalizeEventSlug } from '@/lib/events';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { clubEventSchema } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = clubEventSchema.partial().parse(await request.json());

    if (body.isFeatured) {
      await prisma.clubEvent.updateMany({ data: { isFeatured: false } });
    }

    const event = await prisma.clubEvent.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.slug !== undefined
          ? { slug: normalizeEventSlug(body.slug, body.title) }
          : {}),
        ...(body.lineup !== undefined ? { lineup: body.lineup } : {}),
        ...(body.tag !== undefined ? { tag: body.tag } : {}),
        ...(body.dayLabel !== undefined ? { dayLabel: body.dayLabel } : {}),
        ...(body.dateLabel !== undefined ? { dateLabel: body.dateLabel } : {}),
        ...(body.eventDate !== undefined ? { eventDate: body.eventDate || null } : {}),
        ...(body.accent !== undefined ? { accent: body.accent } : {}),
        ...(body.priceGel !== undefined ? { priceGel: body.priceGel } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
        ...(body.published !== undefined ? { published: body.published } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });

    return NextResponse.json({ event });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    await prisma.clubEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
