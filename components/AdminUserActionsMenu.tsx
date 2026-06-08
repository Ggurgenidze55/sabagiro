'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AdminUserTicketPolicyForm } from '@/components/AdminUserTicketPolicy';
import type { AdminUserRow } from '@/components/AdminUsersPanel';
import { StaffRoleForm } from '@/components/StaffRoleForm';
import {
  canScanAtDoorByRole,
  isProtectedStaffTarget,
  roleBadgeClass,
  roleLabel,
} from '@/lib/staff-roles';

type AdminUserActionsMenuProps = {
  user: AdminUserRow;
  canAssignRoles?: boolean;
  confirmDelete: boolean;
  deleting: boolean;
  onVerify: () => void;
  onReject: () => void;
  onPending: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
  onAddArtist: () => void;
  onRemoveArtist: () => void;
  onEnableDoorScan: () => void;
  onDisableDoorScan: () => void;
};

type DropCoords = {
  top: number;
  left: number;
  minWidth: number;
  maxHeight: number;
};

const GAP = 6;
const VIEWPORT_PAD = 10;

function measureDrop(toggle: HTMLElement, drop: HTMLElement): DropCoords {
  const btn = toggle.getBoundingClientRect();
  const dropHeight = drop.offsetHeight;
  const dropWidth = drop.offsetWidth;
  const minWidth = Math.max(btn.width, 200);

  const spaceBelow = window.innerHeight - btn.bottom - VIEWPORT_PAD;
  const spaceAbove = btn.top - VIEWPORT_PAD;
  const preferUp = spaceBelow < dropHeight + GAP && spaceAbove > spaceBelow;

  let top: number;
  let maxHeight: number;

  if (preferUp) {
    maxHeight = Math.max(120, Math.min(dropHeight, spaceAbove - GAP));
    top = Math.max(VIEWPORT_PAD, btn.top - GAP - maxHeight);
  } else {
    top = btn.bottom + GAP;
    maxHeight = Math.max(120, Math.min(dropHeight, spaceBelow - GAP));
    const bottom = top + maxHeight;
    if (bottom > window.innerHeight - VIEWPORT_PAD) {
      maxHeight = Math.max(120, window.innerHeight - VIEWPORT_PAD - top);
    }
  }

  let left = btn.right - Math.max(dropWidth, minWidth);
  const width = Math.max(dropWidth, minWidth);
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - width - VIEWPORT_PAD));

  return { top, left, minWidth, maxHeight };
}

export function AdminUserActionsMenu({
  user,
  canAssignRoles = false,
  confirmDelete,
  deleting,
  onVerify,
  onReject,
  onPending,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onUpdated,
  onAddArtist,
  onRemoveArtist,
  onEnableDoorScan,
  onDisableDoorScan,
}: AdminUserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'limits' | 'delete' | 'staff-role'>('menu');
  const [coords, setCoords] = useState<DropCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const toggle = toggleRef.current;
    const drop = dropRef.current;
    if (!toggle || !drop) return;
    setCoords(measureDrop(toggle, drop));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, panel, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const drop = dropRef.current;
    if (!drop) return;

    const ro = new ResizeObserver(() => updatePosition());
    ro.observe(drop);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, panel, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || dropRef.current?.contains(target)) return;
      setOpen(false);
      setPanel('menu');
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

  if (isProtectedStaffTarget(user.role)) {
    return <span className={roleBadgeClass(user.role)}>{roleLabel(user.role)}</span>;
  }

  const showLimits = user.verificationStatus === 'VERIFIED';

  const dropClass = `admin-actions__drop admin-actions__drop--fixed${
    panel === 'limits' || panel === 'staff-role' ? ' admin-actions__drop--wide' : ''
  }`;

  const dropContent = open ? (
    <div
      id={menuId}
      ref={dropRef}
      className={dropClass}
      role="menu"
      style={
        coords
          ? {
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              right: 'auto',
              minWidth: coords.minWidth,
              maxWidth: 'min(20rem, calc(100vw - 1.25rem))',
              width: 'max-content',
              maxHeight: coords.maxHeight,
              overflowY: 'auto',
              visibility: 'visible',
            }
          : {
              position: 'fixed',
              top: -9999,
              left: 0,
              right: 'auto',
              visibility: 'hidden',
            }
      }
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
          {user.isArtist ? (
            <button
              type="button"
              className="admin-actions__item"
              role="menuitem"
              onClick={() => runAction(onRemoveArtist)}
            >
              Remove from DJ list
            </button>
          ) : (
            <button
              type="button"
              className="admin-actions__item"
              role="menuitem"
              onClick={() => runAction(onAddArtist)}
            >
              Add to DJ list
            </button>
          )}
          {canAssignRoles ? (
            <button
              type="button"
              className="admin-actions__item"
              role="menuitem"
              onClick={() => setPanel('staff-role')}
            >
              Staff role
            </button>
          ) : null}
          {!canScanAtDoorByRole(user.role) ? (
            user.doorScanEnabled ? (
              <button
                type="button"
                className="admin-actions__item"
                role="menuitem"
                onClick={() => runAction(onDisableDoorScan)}
              >
                Disable door scan
              </button>
            ) : (
              <button
                type="button"
                className="admin-actions__item"
                role="menuitem"
                onClick={() => runAction(onEnableDoorScan)}
              >
                Enable door scan
              </button>
            )
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

      {panel === 'staff-role' && canAssignRoles ? (
        <div className="admin-actions__panel">
          <button type="button" className="admin-actions__back" onClick={() => setPanel('menu')}>
            ← Back
          </button>
          <StaffRoleForm
            userId={user.id}
            currentRole={user.role}
            compact
            onSaved={(role) => {
              onUpdated({ role });
              setPanel('menu');
              close();
            }}
          />
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="admin-actions" ref={rootRef}>
      <button
        ref={toggleRef}
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

      {mounted && open && dropContent ? createPortal(dropContent, document.body) : null}
    </div>
  );
}
