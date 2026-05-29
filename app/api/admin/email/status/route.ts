import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getEmailFrom, isEmailConfigured } from '@/lib/email/config';

export const dynamic = 'force-dynamic';

/** Admin: check whether Resend env is set (no secrets exposed). */
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      configured: isEmailConfigured(),
      from: getEmailFrom(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Login required' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
