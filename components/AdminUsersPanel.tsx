'use client';

import { useEffect, useMemo, useState } from 'react';
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

const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | AdminUserRow['verificationStatus'];

function normalizeSearch(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function userMatchesSearch(user: AdminUserRow, query: string) {
  if (!query) return true;
  const haystack = [
    user.firstName,
    user.lastName,
    `${user.firstName} ${user.lastName}`,
    user.email,
    user.personalId,
    user.phone,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function AdminUsersPanel({ users: initial }: { users: AdminUserRow[] }) {
  const [users, setUsers] = useState(initial);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);

  const searchNorm = normalizeSearch(search);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'ALL' && u.verificationStatus !== statusFilter) return false;
      return userMatchesSearch(u, searchNorm);
    });
  }, [users, statusFilter, searchNorm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchNorm, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

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

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'VERIFIED', label: 'Verified' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {msg ? <p className="form-ok">{msg}</p> : null}

      <div className="admin-users-toolbar">
        <label className="admin-users-search form-field">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or personal ID"
            autoComplete="off"
          />
        </label>
        <div className="admin-users-filters" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`admin-users-filter${statusFilter === f.id ? ' admin-users-filter--active' : ''}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="admin-users-meta">
        {filtered.length === 0
          ? 'No users match'
          : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length}${users.length !== filtered.length ? ` (${users.length} total)` : ''}`}
      </p>

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
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-users-empty">
                  No users on this page. Try another filter or search.
                </td>
              </tr>
            ) : (
              pageUsers.map((u) => (
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
                    <span
                      className={`verify-badge verify-badge--${u.verificationStatus.toLowerCase()}`}
                    >
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
                          Free:{' '}
                          {u.freeTicketsEnabled
                            ? `${u.freeTicketsUsed}/${u.freeTicketsQuota}`
                            : 'off'}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE ? (
        <nav className="admin-users-pagination" aria-label="Users pages">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="admin-users-pagination__info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}
    </>
  );
}
