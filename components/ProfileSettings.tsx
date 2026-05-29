'use client';

import { useState } from 'react';

type User = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  personalId: string;
};

export function ProfileSettings({ user }: { user: User }) {
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passError, setPassError] = useState('');

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

  return (
    <div className="settings-grid">
      <section>
        <h2 className="section-title">Profile</h2>
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
      <section>
        <h2 className="section-title">Password</h2>
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
    </div>
  );
}
