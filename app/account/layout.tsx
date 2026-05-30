import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountSubNav } from '@/components/AccountSubNav';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');

  return (
    <>
      <AccountSubNav />
      {children}
    </>
  );
}
