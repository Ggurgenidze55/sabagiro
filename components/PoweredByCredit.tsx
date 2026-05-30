import { FieryManIcon } from '@/components/FieryManIcon';

type PoweredByCreditProps = {
  className?: string;
};

export function PoweredByCredit({ className }: PoweredByCreditProps) {
  return (
    <p className={['powered-by', className].filter(Boolean).join(' ')}>
      <span className="powered-by__label">Powered by</span>
      <span className="powered-by__name">Tsverebiani Kaci</span>
      <FieryManIcon className="powered-by__icon" />
    </p>
  );
}
