'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ScanDoorActionsProps = {
  qrToken: string;
  status: string;
};

export function ScanDoorActions({ qrToken, status }: ScanDoorActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localStatus, setLocalStatus] = useState(status);

  async function markUsed() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(qrToken)}/mark-used`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update ticket');
        return;
      }
      setLocalStatus('USED');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (localStatus === 'USED') {
    return <p className="form-ok scan-door-msg">Ticket already marked as used at the door.</p>;
  }

  if (localStatus === 'CANCELLED') {
    return <p className="form-error scan-door-msg">This ticket is cancelled.</p>;
  }

  return (
    <div className="scan-door-actions">
      <button type="button" className="btn" onClick={markUsed} disabled={loading}>
        {loading ? '…' : 'MARK USED (DOOR)'}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
