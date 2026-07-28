'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SectionDivider } from '@/components/SectionDivider';

type User = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  personalId: string;
};

export function ProfileSettings({ user }: { user: User }) {
  const router = useRouter();
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passError, setPassError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(data.error || 'Failed');
        return;
      }
      setProfileMsg('Profile updated');
    } catch {
      setProfileError('Network error');
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPassError('');
    setPassMsg('');
    const fd = new FormData(form);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPassError(data.error || 'Failed');
        return;
      }
      setPassMsg('Password changed');
      form.reset();
    } catch {
      setPassError('Network error');
    }
  }

  async function deleteAccount() {
    setDeleteError('');
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password');
      return;
    }

    setDeleteBusy(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirm: 'DELETE' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setDeleteError('Network error');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="settings-grid">
      <section className="settings-grid__col">
        <h2 className="section-title settings-grid__title">Profile</h2>
        <p className="form-foot form-foot--note">
          First name, last name, and personal ID are set at registration and cannot be changed.
        </p>
        <dl className="identity-readonly">
          <div>
            <dt>First name</dt>
            <dd>{user.firstName}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{user.lastName}</dd>
          </div>
          <div>
            <dt>Personal ID</dt>
            <dd>{user.personalId}</dd>
          </div>
        </dl>
        <form className="form-stack" onSubmit={saveProfile}>
          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" defaultValue={user.email} required />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input name="phone" defaultValue={user.phone} required />
          </label>
          {profileError ? <p className="form-error">{profileError}</p> : null}
          {profileMsg ? <p className="form-ok">{profileMsg}</p> : null}
          <button type="submit" className="btn">
            SAVE PROFILE
          </button>
        </form>
      </section>
      <SectionDivider index={2} className="settings-grid__rule" />
      <section className="settings-grid__col">
        <h2 className="section-title settings-grid__title">Password</h2>
        <form className="form-stack" onSubmit={savePassword}>
          <label className="form-field">
            <span>Current password</span>
            <input name="currentPassword" type="password" required />
          </label>
          <label className="form-field">
            <span>New password</span>
            <input name="newPassword" type="password" required minLength={8} />
          </label>
          {passError ? <p className="form-error">{passError}</p> : null}
          {passMsg ? <p className="form-ok">{passMsg}</p> : null}
          <button type="submit" className="btn btn--ghost">
            CHANGE PASSWORD
          </button>
        </form>
      </section>
      <SectionDivider index={3} className="settings-grid__rule" />
      <section className="settings-grid__col settings-grid__col--danger">
        <h2 className="section-title settings-grid__title">Delete account</h2>
        <p className="form-foot form-foot--note">
          Permanently removes your profile, orders, and tickets. This cannot be undone.
        </p>
        {!deleteOpen ? (
          <button type="button" className="btn btn--danger" onClick={() => setDeleteOpen(true)}>
            DELETE MY ACCOUNT
          </button>
        ) : (
          <div className="delete-confirm">
            <p className="delete-confirm__text">
              You are deleting <strong>{user.email}</strong>. Type DELETE and enter your password to
              confirm.
            </p>
            <div className="form-stack">
              <label className="form-field">
                <span>Type DELETE</span>
                <input
                  name="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="form-field">
                <span>Password</span>
                <input
                  name="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            </div>
            {deleteError ? <p className="form-error">{deleteError}</p> : null}
            <div className="delete-confirm__actions">
              <button
                type="button"
                className="btn btn--danger"
                disabled={deleteBusy}
                onClick={deleteAccount}
              >
                {deleteBusy ? 'DELETING…' : 'CONFIRM DELETE'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={deleteBusy}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword('');
                  setDeleteConfirm('');
                  setDeleteError('');
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
