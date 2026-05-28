import { NextResponse } from 'next/server';
import { normalizeAllEventSlugs } from '@/lib/events';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  try {
    await requireAdmin();
    const updated = await normalizeAllEventSlugs();
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status =
      message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
