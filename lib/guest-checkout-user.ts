import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { normalizePersonalId } from '@/lib/personal-id';

/** Internal row for paid checkout without login (event must allow ID-only mode). Not a registrable member. */
export async function findOrCreateUserForGuestCheckout(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.guestCheckoutOnly) {
      throw new Error('GUEST_EMAIL_HAS_ACCOUNT');
    }
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        phone: input.phone.trim(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        personalId: normalizePersonalId(input.personalId),
      },
    });
  }

  const { hashPassword } = await import('@/lib/auth');
  const tempPassword = randomBytes(24).toString('base64url');
  return prisma.user.create({
    data: {
      email,
      phone: input.phone.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      personalId: normalizePersonalId(input.personalId),
      passwordHash: await hashPassword(tempPassword),
      role: 'USER',
      verificationStatus: 'PENDING',
      guestCheckoutOnly: true,
      facebookUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
    },
  });
}
