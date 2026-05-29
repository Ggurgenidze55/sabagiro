import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email/index';
import { createPasswordResetLink, PASSWORD_RESET_TTL_MINUTES } from '@/lib/password-reset';
import { zodErrorMessage } from '@/lib/zod-error';
import { forgotPasswordSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetUrl = await createPasswordResetLink(user.id);
      if (resetUrl) {
        await sendPasswordResetEmail({
          to: user.email,
          firstName: user.firstName,
          resetUrl,
          expiresMinutes: PASSWORD_RESET_TTL_MINUTES,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If that email is registered, we sent a reset link.',
    });
  } catch (e) {
    return NextResponse.json({ error: zodErrorMessage(e) }, { status: 400 });
  }
}
