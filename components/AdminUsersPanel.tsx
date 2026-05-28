'use client';

import { useState } from 'react';

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
    setMsg('Verification status updated');
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
      setMsg(`${user.firstName} ${user.lastName} წაიშალა`);
    } catch {
      setError('Network error');
    } finally {
      setDeletingId(null);
    }
  }

  function onDeleteClick(user: AdminUserRow) {
    if (user.role === 'ADMIN') return;

    if (user.verificationStatus === 'VERIFIED') {
      if (confirmDeleteId === user.id) return;
      setConfirmDeleteId(user.id);
      setError('');
      setMsg('');
      return;
    }

    void deleteUser(user);
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}
      <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Social</th>
            <th>Status</th>
            <th>Tickets</th>
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
              <td className="table-actions">
                {u.role !== 'ADMIN' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setStatus(u.id, 'VERIFIED')}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setStatus(u.id, 'REJECTED')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setStatus(u.id, 'PENDING')}
                    >
                      Pending
                    </button>
                    {confirmDeleteId === u.id ? (
                      <div className="delete-confirm">
                        <p className="delete-confirm__text">
                          ვერიფიცირებული მომხმარებელი — ნამდვილად წავშალოთ?
                        </p>
                        <div className="delete-confirm__actions">
                          <button
                            type="button"
                            className="btn btn--danger"
                            disabled={deletingId === u.id}
                            onClick={() => void deleteUser(u)}
                          >
                            {deletingId === u.id ? '…' : 'დიახ, წაშლა'}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled={deletingId === u.id}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            გაუქმება
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--danger"
                        disabled={deletingId === u.id}
                        onClick={() => onDeleteClick(u)}
                      >
                        {deletingId === u.id ? '…' : 'წაშლა'}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="table-sub">ADMIN</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
