import { NextResponse } from 'next/server';
import { hashPassword, setSessionCookie, toSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendWelcomeRegistrationEmail } from '@/lib/email/index';
import { zodErrorMessage } from '@/lib/zod-error';
import { registerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists && !exists.guestCheckoutOnly) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const registerData = {
      email,
      phone: body.phone,
      firstName: body.firstName,
      lastName: body.lastName,
      personalId: body.personalId,
      facebookUrl: body.facebookUrl ?? '',
      instagramUrl: body.instagramUrl ?? '',
      linkedinUrl: body.linkedinUrl ?? '',
      passwordHash: await hashPassword(body.password),
      role: 'USER' as const,
      verificationStatus: 'PENDING' as const,
      guestCheckoutOnly: false,
    };

    const user = exists
      ? await prisma.user.update({
          where: { id: exists.id },
          data: registerData,
        })
      : await prisma.user.create({ data: registerData });

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
