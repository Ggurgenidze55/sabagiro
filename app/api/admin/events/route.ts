import { NextResponse } from 'next/server';
import { slugifyTitle } from '@/lib/events';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { clubEventSchema } from '@/lib/validators';

export async function GET() {
  try {
    await requireAdmin();
    const events = await prisma.clubEvent.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
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
    const slug = body.slug?.trim() || slugifyTitle(body.title);

    const exists = await prisma.clubEvent.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    if (body.isFeatured) {
      await prisma.clubEvent.updateMany({ data: { isFeatured: false } });
    }

    const event = await prisma.clubEvent.create({
      data: {
        slug,
        title: body.title,
        lineup: body.lineup ?? '',
        tag: body.tag ?? '',
        dayLabel: body.dayLabel,
        dateLabel: body.dateLabel,
        eventDate: body.eventDate || null,
        accent: body.accent,
        priceGel: body.priceGel,
        isFeatured: body.isFeatured ?? false,
        published: body.published ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ event });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
