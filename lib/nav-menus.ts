import type { NavDropdownItem } from '@/components/NavDropdown';
import type { Role } from '@/generated/prisma/client';
import {
  canManageUsers,
  canUseFullAdminTools,
  canViewEventsAdmin,
} from '@/lib/staff-roles';

export const ACCOUNT_MENU_ITEMS: NavDropdownItem[] = [
  { href: '/account', label: 'Tickets' },
  { href: '/account/settings', label: 'Settings' },
];

/** Full admin menu (legacy export). */
export const ADMIN_MENU_ITEMS: NavDropdownItem[] = [
  { href: '/account', label: 'Tickets' },
  { href: '/account/settings', label: 'Settings' },
  { href: '/admin/events', label: 'Manage events' },
  { href: '/admin/artists', label: 'DJ list' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/generate', label: 'Generate tickets' },
  { href: '/admin/tickets', label: 'All tickets' },
];

export function getStaffMenuItems(role: Role): NavDropdownItem[] {
  const items: NavDropdownItem[] = [
    { href: '/account', label: 'Tickets' },
    { href: '/account/settings', label: 'Settings' },
  ];

  if (canViewEventsAdmin(role)) {
    items.push({ href: '/admin/events', label: 'Manage events' });
  }
  if (canManageUsers(role)) {
    items.push({ href: '/admin/users', label: 'Users' });
  }
  if (canUseFullAdminTools(role)) {
    items.push(
      { href: '/admin/artists', label: 'DJ list' },
      { href: '/admin/generate', label: 'Generate tickets' },
      { href: '/admin/tickets', label: 'All tickets' },
    );
  }

  return items;
}
