import { AccountSubnav } from '@/components/AccountSubnav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountSubnav />
      {children}
    </>
  );
}
