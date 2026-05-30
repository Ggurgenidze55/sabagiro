'use client';

import { useState } from 'react';
import { AdminUserActionsMenu } from '@/components/AdminUserActionsMenu';

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string;
  facebookUrl: string;
  instagramUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  role: string;
  ticketCount: number;
  ticketLimitPerEvent: number;
  freeTicketsEnabled: boolean;
  freeTicketsQuota: number;
  freeTicketsUsed: number;
};

export function AdminUsersPanel({ users: initial }: { users: AdminUserRow[] }) {
  const [users, setUsers] = useState(initial);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function setStatus(userId: string, status: AdminUserRow['verificationStatus']) {
    setError('');
    setMsg('');
    const res = await fetch(`/api/admin/users/${userId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to update');
      return;
    }
    setUsers((list) =>
      list.map((u) => (u.id === userId ? { ...u, verificationStatus: status } : u)),
    );
    if (data.email?.sent) {
      setMsg(`Status updated — email sent to user`);
    } else if (data.email?.skipped) {
      setMsg('Status updated (email skipped — RESEND_API_KEY not set)');
    } else if (data.email && !data.email.sent) {
      setError(data.email.error || 'Status updated but email failed');
    } else {
      setMsg('Verification status updated');
    }
  }

  async function deleteUser(user: AdminUserRow) {
    setError('');
    setMsg('');
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not delete user');
        return;
      }
      setUsers((list) => list.filter((u) => u.id !== user.id));
      setConfirmDeleteId(null);
      setMsg(`${user.firstName} ${user.lastName} deleted`);
    } catch {
      setError('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  function requestDelete(user: AdminUserRow) {
    if (user.role === 'ADMIN') return;
    if (user.verificationStatus === 'VERIFIED') {
      setConfirmDeleteId(user.id);
      return;
    }
    void deleteUser(user);
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}
      <div className="table-scroll admin-users-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Social</th>
              <th>Status</th>
              <th>Tickets</th>
              <th>Limits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                  <br />
                  <span className="table-sub">{u.personalId}</span>
                </td>
                <td>
                  {u.email}
                  <br />
                  <span className="table-sub">{u.phone}</span>
                </td>
                <td className="user-social">
                  {u.facebookUrl ? (
                    <a href={u.facebookUrl} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  ) : (
                    <span className="table-sub">—</span>
                  )}
                  <br />
                  {u.instagramUrl ? (
                    <a href={u.instagramUrl} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  ) : (
                    <span className="table-sub">—</span>
                  )}
                </td>
                <td>
                  <span className={`verify-badge verify-badge--${u.verificationStatus.toLowerCase()}`}>
                    {u.verificationStatus}
                  </span>
                </td>
                <td>{u.ticketCount}</td>
                <td>
                  {u.role !== 'ADMIN' && u.verificationStatus === 'VERIFIED' ? (
                    <>
                      <span className="table-sub">Paid: {u.ticketLimitPerEvent}/event</span>
                      <br />
                      <span className="table-sub">
                        Free: {u.freeTicketsEnabled ? `${u.freeTicketsUsed}/${u.freeTicketsQuota}` : 'off'}
                      </span>
                    </>
                  ) : (
                    <span className="table-sub">—</span>
                  )}
                </td>
                <td className="table-actions table-actions--menu">
                  <AdminUserActionsMenu
                    user={u}
                    confirmDelete={confirmDeleteId === u.id}
                    deleting={deletingId === u.id}
                    onVerify={() => void setStatus(u.id, 'VERIFIED')}
                    onReject={() => void setStatus(u.id, 'REJECTED')}
                    onPending={() => void setStatus(u.id, 'PENDING')}
                    onDelete={() => requestDelete(u)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onConfirmDelete={() => void deleteUser(u)}
                    onUpdated={(patch) =>
                      setUsers((list) =>
                        list.map((row) => (row.id === u.id ? { ...row, ...patch } : row)),
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
