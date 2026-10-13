import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { normalizePersonalId } from '@/lib/personal-id';

/** Shadow account for paid checkout without login (event must allow ID-only mode). */
export async function findOrCreateUserForGuestCheckout(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalId: string;
}) {
  const email = input.email.trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

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
      facebookUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
    },
  });
}
