import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { runVerifiedInviteDispatch } from '@/lib/verified-invites';

const bodySchema = z.object({
  eventSlug: z.string().trim().min(1).optional(),
});

/** Admin: email verified members invitations now (invitation-only events with auto-invite enabled). */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = bodySchema.safeParse(await request.json().catch(() => ({})));
    const eventSlug = body.success ? body.data.eventSlug : undefined;

    const result = await runVerifiedInviteDispatch({
      eventSlug,
      createdByUserId: admin.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
