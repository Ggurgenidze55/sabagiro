import type { NavDropdownItem } from '@/components/NavDropdown';

export const ACCOUNT_MENU_ITEMS: NavDropdownItem[] = [
  { href: '/account', label: 'Tickets' },
  { href: '/account/settings', label: 'Settings' },
];

export const ADMIN_MENU_ITEMS: NavDropdownItem[] = [
  { href: '/account', label: 'Tickets' },
  { href: '/account/settings', label: 'Settings' },
  { href: '/admin/events', label: 'Manage events' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/generate', label: 'Generate tickets' },
  { href: '/admin/tickets', label: 'All tickets' },
];
