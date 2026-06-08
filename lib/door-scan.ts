import type { Role } from '@/generated/prisma/client';
import { getSessionUser, requireUser } from '@/lib/auth';
import { canScanAtDoorByRole } from '@/lib/staff-roles';

export function canScanAtDoor(user: { role: Role; doorScanEnabled: boolean }) {
  return canScanAtDoorByRole(user.role) || user.doorScanEnabled;
}

export async function requireDoorScanner() {
  const user = await requireUser();
  if (!canScanAtDoor(user)) throw new Error('FORBIDDEN');
  return user;
}

export async function getDoorScanner() {
  const user = await getSessionUser();
  if (!user || !canScanAtDoor(user)) return null;
  return user;
}
