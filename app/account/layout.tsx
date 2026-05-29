import type { Metadata } from 'next';
import { AccountSubnav } from '@/components/AccountSubnav';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountSubnav />
      {children}
    </>
  );
}
