import type { ScanVerdict as Verdict } from '@/lib/ticket-scan';

export function ScanVerdict({ verdict }: { verdict: Verdict }) {
  return (
    <div className={`scan-verdict scan-verdict--${verdict.tone}`} role="status">
      <p className="scan-verdict__title">{verdict.title}</p>
      <p className="scan-verdict__sub">{verdict.subtitle}</p>
    </div>
  );
}
