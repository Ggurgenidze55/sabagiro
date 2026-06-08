'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StaffRoleForm } from '@/components/StaffRoleForm';

type ScanStaffRolePanelProps = {
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
};

export function ScanStaffRolePanel({
  userId,
  userName,
  userEmail,
  currentRole,
}: ScanStaffRolePanelProps) {
  const router = useRouter();
  const [msg, setMsg] = useState('');

  return (
    <div className="scan-staff-role">
      <p className="scan-staff-role__title">Staff role · ticket owner</p>
      <p className="scan-staff-role__meta">
        {userName} · {userEmail}
      </p>
      <StaffRoleForm
        userId={userId}
        currentRole={currentRole}
        onSaved={(_role, label) => {
          setMsg(`Role updated — ${label}`);
          router.refresh();
        }}
      />
      {msg ? <p className="form-ok">{msg}</p> : null}
    </div>
  );
}
