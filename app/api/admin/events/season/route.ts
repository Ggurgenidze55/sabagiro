import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getEventsSeasonLabel, setEventsSeasonLabel } from '@/lib/events';

export async function GET() {
  try {
    await requireAdmin();
    const season = await getEventsSeasonLabel();
    return NextResponse.json({ season });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { season } = z.object({ season: z.string().trim().min(1).max(80) }).parse(await request.json());
    await setEventsSeasonLabel(season);
    return NextResponse.json({ season });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
