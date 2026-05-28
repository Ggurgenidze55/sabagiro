import type { ScanVerdict as Verdict } from '@/lib/ticket-scan';

export function ScanVerdict({ verdict }: { verdict: Verdict }) {
  return (
    <div className={`scan-verdict scan-verdict--${verdict.tone}`} role="status">
      <p className="scan-verdict__title">{verdict.titleKa}</p>
      <p className="scan-verdict__title-en">{verdict.title}</p>
      <p className="scan-verdict__sub">{verdict.subtitleKa}</p>
      <p className="scan-verdict__sub-en">{verdict.subtitle}</p>
    </div>
  );
}
