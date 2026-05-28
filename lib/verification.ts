import type { Role, VerificationStatus } from '@prisma/client';

export function canPurchaseTickets(user: {
  role: Role;
  verificationStatus: VerificationStatus;
}) {
  if (user.role === 'ADMIN') return true;
  return user.verificationStatus === 'VERIFIED';
}

export function verificationLabel(status: VerificationStatus) {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'REJECTED':
      return 'Not verified';
    default:
      return 'Pending review';
  }
}
