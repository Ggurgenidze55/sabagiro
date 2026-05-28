'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ScanDoorCheckProps = {
  qrToken: string;
  status: string;
  canCheckIn: boolean;
};

export function ScanDoorCheck({ qrToken, status, canCheckIn }: ScanDoorCheckProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function confirmScan() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(qrToken)}/mark-used`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Scan failed');
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'USED' || done) {
    return null;
  }

  if (status === 'CANCELLED') {
    return null;
  }

  if (!canCheckIn) {
    return (
      <p className="scan-door-hint">
        Log in as admin to confirm scan at the door.
      </p>
    );
  }

  return (
    <div className="scan-door-actions">
      <button type="button" className="btn scan-door-actions__btn" onClick={confirmScan} disabled={loading}>
        {loading ? '…' : 'CONFIRM ENTRY'}
      </button>
      <p className="scan-door-hint">One scan per ticket. After confirm, this QR cannot be used again.</p>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
