import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email/client';
import { isEmailConfigured } from '@/lib/email/config';
import { testEmail } from '@/lib/email/templates';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  to: z.string().email().optional(),
});

/** Admin: send one test email via Resend. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not set in Vercel / .env.local' },
        { status: 503 },
      );
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const to = parsed.data.to || admin.email;
    const msg = testEmail();
    const result = await sendEmail({ to, ...msg });

    if (!result.sent) {
      return NextResponse.json(
        { error: result.error || 'Send failed', skipped: result.skipped },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, to, id: result.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Login required' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
