import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPasswordChangedEmail } from '@/lib/email/index';
import { consumePasswordResetToken } from '@/lib/password-reset';
import { zodErrorMessage } from '@/lib/zod-error';
import { resetPasswordSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(await request.json());
    const consumed = await consumePasswordResetToken(token);

    if (!consumed) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Request a new one.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    sendPasswordChangedEmail({ to: user.email, firstName: user.firstName });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: zodErrorMessage(e) }, { status: 400 });
  }
}
