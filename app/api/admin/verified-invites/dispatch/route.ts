import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { runVerifiedInviteDispatch } from '@/lib/verified-invites';

const bodySchema = z.object({
  eventSlug: z.string().trim().min(1),
});

/** Admin: email verified members invitations for one invitation-only event. */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: 'Event is required' }, { status: 400 });
    }

    const result = await runVerifiedInviteDispatch({
      eventSlug: body.data.eventSlug,
      createdByUserId: admin.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
