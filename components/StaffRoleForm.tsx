'use client';

import { useState } from 'react';
import { ASSIGNABLE_STAFF_ROLES, roleLabel } from '@/lib/staff-roles';

type StaffRoleFormProps = {
  userId: string;
  currentRole: string;
  compact?: boolean;
  onSaved?: (role: string, roleLabelText: string) => void;
};

export function StaffRoleForm({ userId, currentRole, compact, onSaved }: StaffRoleFormProps) {
  const [role, setRole] = useState(currentRole === 'USER' ? 'USER' : currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function saveRole() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update role');
        return;
      }
      onSaved?.(role, data.roleLabel ?? roleLabel(role));
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? 'staff-role-form staff-role-form--compact' : 'staff-role-form'}>
      <label className="form-field">
        <span>Staff role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading}>
          <option value="USER">Member (no staff access)</option>
          {ASSIGNABLE_STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </label>
      {!compact ? (
        <p className="form-foot staff-role-form__hint">
          Event Manager — create · User Manager — edit events &amp; users · Main Moderator — users,
          scan &amp; assign roles
        </p>
      ) : null}
      <button type="button" className="btn btn--ghost" onClick={saveRole} disabled={loading}>
        {loading ? '…' : 'Save role'}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
