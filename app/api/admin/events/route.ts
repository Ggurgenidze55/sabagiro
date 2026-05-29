import { NextResponse } from 'next/server';
import { normalizeEventSlug } from '@/lib/events';
import { labelsFromEventDate } from '@/lib/event-date-labels';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sortPublishedEvents } from '@/lib/sort-published-events';
import { clubEventSchema, formatValidationError } from '@/lib/validators';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.clubEvent.findMany({
      include: { ticketTiers: { orderBy: { sortOrder: 'asc' } } },
    });
    const events = sortPublishedEvents(rows);
    return NextResponse.json({ events });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = clubEventSchema.parse(await request.json());
    const slug = normalizeEventSlug(body.slug ?? '', body.title);

    const exists = await prisma.clubEvent.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    if (body.isFeatured) {
      await prisma.clubEvent.updateMany({ data: { isFeatured: false } });
    }

    const tiersInput =
      body.tiers && body.tiers.length > 0
        ? body.tiers
        : [{ quantity: 100, priceGel: body.priceGel, label: 'Standard' }];

    const derivedLabels = labelsFromEventDate(body.eventDate);
    const dayLabel = derivedLabels?.dayLabel ?? body.dayLabel;
    const dateLabel = derivedLabels?.dateLabel ?? body.dateLabel;

    const event = await prisma.clubEvent.create({
      data: {
        slug,
        title: body.title,
        about: body.about ?? '',
        imagePath: body.imagePath ?? '',
        lineup: body.lineup ?? '',
        tag: body.tag ?? '',
        dayLabel,
        dateLabel,
        eventDate: body.eventDate,
        accent: body.accent,
        priceGel: tiersInput[0].priceGel,
        isFeatured: body.isFeatured ?? false,
        published: body.published ?? true,
        sortOrder: body.sortOrder ?? 0,
        ticketTiers: {
          create: tiersInput.map((tier, index) => ({
            sortOrder: index,
            label: tier.label ?? '',
            quantity: tier.quantity,
            priceGel: tier.priceGel,
          })),
        },
      },
      include: { ticketTiers: { orderBy: { sortOrder: 'asc' } } },
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
