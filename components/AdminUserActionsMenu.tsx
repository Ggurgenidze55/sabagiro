'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AdminUserTicketPolicyForm } from '@/components/AdminUserTicketPolicy';
import type { AdminUserRow } from '@/components/AdminUsersPanel';

type AdminUserActionsMenuProps = {
  user: AdminUserRow;
  confirmDelete: boolean;
  deleting: boolean;
  onVerify: () => void;
  onReject: () => void;
  onPending: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
};

export function AdminUserActionsMenu({
  user,
  confirmDelete,
  deleting,
  onVerify,
  onReject,
  onPending,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onUpdated,
}: AdminUserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'limits' | 'delete'>('menu');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPanel('menu');
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setPanel('menu');
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (confirmDelete) {
      setOpen(true);
      setPanel('delete');
    }
  }, [confirmDelete]);

  function close() {
    setOpen(false);
    setPanel('menu');
  }

  function runAction(fn: () => void) {
    fn();
    close();
  }

  if (user.role === 'ADMIN') {
    return <span className="table-sub">ADMIN</span>;
  }

  const showLimits = user.verificationStatus === 'VERIFIED';

  return (
    <div className="admin-actions" ref={rootRef}>
      <button
        type="button"
        className="btn btn--ghost admin-actions__toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) setPanel('menu');
            return next;
          });
        }}
      >
        Actions {open ? '▴' : '▾'}
      </button>

      {open ? (
        <div
          id={menuId}
          className={`admin-actions__drop${panel === 'limits' ? ' admin-actions__drop--wide' : ''}`}
          role="menu"
        >
          {panel === 'menu' ? (
            <>
              <button type="button" className="admin-actions__item" role="menuitem" onClick={() => runAction(onVerify)}>
                Verify
              </button>
              <button type="button" className="admin-actions__item" role="menuitem" onClick={() => runAction(onReject)}>
                Reject
              </button>
              <button type="button" className="admin-actions__item" role="menuitem" onClick={() => runAction(onPending)}>
                Pending
              </button>
              {showLimits ? (
                <button
                  type="button"
                  className="admin-actions__item"
                  role="menuitem"
                  onClick={() => setPanel('limits')}
                >
                  Limits / free tickets
                </button>
              ) : null}
              <button
                type="button"
                className="admin-actions__item admin-actions__item--danger"
                role="menuitem"
                onClick={() => setPanel('delete')}
              >
                Delete user
              </button>
            </>
          ) : null}

          {panel === 'delete' ? (
            <div className="admin-actions__panel">
              <p className="admin-actions__panel-title">Delete user?</p>
              <p className="admin-actions__panel-text">
                {user.firstName} {user.lastName} — this cannot be undone.
              </p>
              <div className="admin-actions__panel-actions">
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={deleting}
                  onClick={() => {
                    onConfirmDelete();
                    close();
                  }}
                >
                  {deleting ? '…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={deleting}
                  onClick={() => {
                    onCancelDelete();
                    setPanel('menu');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {panel === 'limits' && showLimits ? (
            <div className="admin-actions__panel">
              <button type="button" className="admin-actions__back" onClick={() => setPanel('menu')}>
                ← Back
              </button>
              <AdminUserTicketPolicyForm user={user} onUpdated={onUpdated} onSaved={close} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
