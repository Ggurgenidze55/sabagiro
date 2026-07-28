import type { Role } from '@/generated/prisma/client';

/** Staff roles assignable by Main Moderator / Admin (not ADMIN). */
export const ASSIGNABLE_STAFF_ROLES = [
  'EVENT_MANAGER',
  'USER_MANAGER',
  'MAIN_MODERATOR',
] as const satisfies readonly Role[];

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

const STAFF_ROLES: Role[] = [
  'EVENT_MANAGER',
  'USER_MANAGER',
  'MAIN_MODERATOR',
  'ADMIN',
];

export function isStaffRole(role: Role | string): boolean {
  return STAFF_ROLES.includes(role as Role);
}

export function isFullAdmin(role: Role | string): boolean {
  return role === 'ADMIN';
}

export function isProtectedStaffTarget(role: Role | string): boolean {
  return role === 'ADMIN';
}

/** Non-admin staff accounts (Event/User Manager, Main Moderator). */
export function isManagedStaffTarget(role: Role | string): boolean {
  return isStaffRole(role) && role !== 'ADMIN';
}

/** User Manager / Main Moderator actions on a member (verify, limits, door scan, delete). */
export function canUserManagerActOnTarget(
  actorRole: Role | string,
  targetRole: Role | string,
): boolean {
  if (isProtectedStaffTarget(targetRole)) return false;
  if (isManagedStaffTarget(targetRole) && actorRole !== 'ADMIN') return false;
  return true;
}

/** Role assignment: Main Moderator may promote members only; Admin manages all staff. */
export function canAssignRoleToTarget(
  actorRole: Role | string,
  targetRole: Role | string,
): boolean {
  if (isProtectedStaffTarget(targetRole)) return false;
  if (actorRole === 'ADMIN') return true;
  if (actorRole === 'MAIN_MODERATOR') return targetRole === 'USER';
  return false;
}

export function canManageDjList(role: Role | string): boolean {
  return role === 'ADMIN';
}

/** Redirect staff without page access to their landing area instead of /account. */
export function staffDeniedRedirectPath(role: Role | string | null | undefined): string {
  if (role && canAccessAdminPanel(role)) return staffAdminLandingPath(role);
  return '/account';
}

export function roleLabel(role: Role | string): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'EVENT_MANAGER':
      return 'Event Manager';
    case 'USER_MANAGER':
      return 'User Manager';
    case 'MAIN_MODERATOR':
      return 'Main Moderator';
    default:
      return 'Member';
  }
}

export function roleBadgeClass(role: Role | string): string {
  switch (role) {
    case 'ADMIN':
      return 'role-badge role-badge--admin';
    case 'EVENT_MANAGER':
      return 'role-badge role-badge--event-manager';
    case 'USER_MANAGER':
      return 'role-badge role-badge--user-manager';
    case 'MAIN_MODERATOR':
      return 'role-badge role-badge--main-moderator';
    default:
      return '';
  }
}

export function canCreateEvents(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'EVENT_MANAGER';
}

export function canEditEvents(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'EVENT_MANAGER';
}

export function canViewEventsAdmin(role: Role | string): boolean {
  return canCreateEvents(role) || canEditEvents(role);
}

export function canManageUsers(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'USER_MANAGER' || role === 'MAIN_MODERATOR';
}

export function canAssignStaffRoles(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'MAIN_MODERATOR';
}

export function canScanAtDoorByRole(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'MAIN_MODERATOR';
}

export function canUseFullAdminTools(role: Role | string): boolean {
  return role === 'ADMIN';
}

export function canAccessAdminPanel(role: Role | string): boolean {
  return isStaffRole(role);
}

export function staffAdminLandingPath(role: Role | string): string {
  if (role === 'EVENT_MANAGER') return '/admin/events';
  if (role === 'USER_MANAGER') return '/admin/users';
  if (role === 'MAIN_MODERATOR') return '/admin/users';
  return '/admin';
}
