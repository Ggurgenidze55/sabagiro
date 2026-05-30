import { AccountSubNav, type AccountSubNavCurrent } from '@/components/AccountSubNav';
import { getSessionUser } from '@/lib/auth';

type AccountSubNavGateProps = {
  current?: AccountSubNavCurrent;
};

export async function AccountSubNavGate({ current }: AccountSubNavGateProps) {
  const user = await getSessionUser();
  if (!user) return null;
  return <AccountSubNav current={current} />;
}
