import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStaffMenuItems, showStaffNav } from '@/lib/nav-menus';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null, staffMenu: [] });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      freeTicketsEnabled: user.freeTicketsEnabled,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    staffMenu: showStaffNav(user.role) ? getStaffMenuItems(user.role) : [],
  });
}
