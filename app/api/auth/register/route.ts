import { NextResponse } from 'next/server';
import { hashPassword, setSessionCookie, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendWelcomeRegistrationEmail } from '@/lib/email/index';
import { zodErrorMessage } from '@/lib/zod-error';
import { registerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        personalId: body.personalId,
        facebookUrl: body.facebookUrl,
        instagramUrl: body.instagramUrl,
        passwordHash: await hashPassword(body.password),
        role: 'USER',
        verificationStatus: 'PENDING',
      },
    });

    const emailResult = await sendWelcomeRegistrationEmail({
      to: user.email,
      firstName: user.firstName,
    });
    if (!emailResult.sent) {
      console.error('[register] welcome email failed', {
        to: user.email,
        skipped: emailResult.skipped,
        error: emailResult.error,
      });
    }

    await setSessionCookie(toSessionUser(user));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: zodErrorMessage(e) }, { status: 400 });
  }
}
