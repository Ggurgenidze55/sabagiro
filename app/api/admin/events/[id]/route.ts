import { NextResponse } from 'next/server';
import { normalizeEventSlug } from '@/lib/events';
import { labelsFromEventDate } from '@/lib/event-date-labels';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { clubEventSchema, formatValidationError } from '@/lib/validators';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = clubEventSchema.partial().parse(await request.json());

    const existing = await prisma.clubEvent.findUnique({
      where: { id: params.id },
      include: { ticketTiers: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (body.isFeatured) {
      await prisma.clubEvent.updateMany({
        where: { id: { not: params.id } },
        data: { isFeatured: false },
      });
    }

    const nextTitle = body.title ?? existing.title;
    let nextSlug = existing.slug;
    if (body.slug !== undefined) {
      nextSlug = normalizeEventSlug(body.slug, nextTitle);
    }

    if (nextSlug !== existing.slug) {
      const slugTaken = await prisma.clubEvent.findFirst({
        where: { slug: nextSlug, id: { not: params.id } },
      });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
    }

    const isFreeEntry = body.isFreeEntry ?? existing.isFreeEntry;
    const freeEntryAccess =
      body.freeEntryAccess ??
      ((existing as typeof existing & { freeEntryAccess?: 'ALL_VERIFIED' | 'INVITED_ONLY' })
        .freeEntryAccess ?? 'INVITED_ONLY');
    const derivedLabels = body.eventDate ? labelsFromEventDate(body.eventDate) : null;
    const dayLabel = derivedLabels?.dayLabel ?? body.dayLabel ?? existing.dayLabel;
    const dateLabel = derivedLabels?.dateLabel ?? body.dateLabel ?? existing.dateLabel;
    const eventDate =
      body.eventDate !== undefined ? body.eventDate || null : existing.eventDate;

    const tiersInput = body.tiers?.length
      ? body.tiers
      : isFreeEntry && body.isFreeEntry === true
        ? [{ label: 'Free entry', quantity: 9999, priceGel: 0 }]
        : null;

    const priceGel =
      body.priceGel !== undefined
        ? isFreeEntry
          ? 0
          : body.priceGel
        : tiersInput?.[0]?.priceGel ?? (isFreeEntry ? 0 : existing.priceGel);

    const event = await prisma.$transaction(async (tx) => {
      if (tiersInput) {
        await tx.eventTicketTier.deleteMany({ where: { eventId: params.id } });
        await tx.eventTicketTier.createMany({
          data: tiersInput.map((tier, index) => ({
            eventId: params.id,
            sortOrder: index,
            label: tier.label ?? '',
            quantity: tier.quantity,
            priceGel: tier.priceGel,
          })),
        });
      }

      return tx.clubEvent.update({
        where: { id: params.id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(nextSlug !== existing.slug ? { slug: nextSlug } : {}),
          ...(body.about !== undefined ? { about: body.about } : {}),
          ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
          ...(body.lineup !== undefined ? { lineup: body.lineup } : {}),
          ...(body.tag !== undefined ? { tag: body.tag } : {}),
          dayLabel,
          dateLabel,
          eventDate,
          ...(body.accent !== undefined ? { accent: body.accent } : {}),
          priceGel,
          ...(body.isFreeEntry !== undefined ? { isFreeEntry: body.isFreeEntry } : {}),
          ...(body.freeEntryAccess !== undefined || body.isFreeEntry !== undefined
            ? { freeEntryAccess: isFreeEntry ? freeEntryAccess : 'INVITED_ONLY' }
            : {}),
          ...(body.artistTicketsEnabled !== undefined
            ? { artistTicketsEnabled: body.artistTicketsEnabled }
            : {}),
          ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
          ...(body.published !== undefined ? { published: body.published } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        } as Parameters<typeof tx.clubEvent.update>[0]['data'],
        include: { ticketTiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return NextResponse.json({ event });
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
