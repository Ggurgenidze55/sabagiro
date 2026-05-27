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
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json();
    if (!res.ok) {
      setProfileError(data.error || 'Failed');
      return;
    }
    setProfileMsg('Profile updated');
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassError('');
    setPassMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json();
    if (!res.ok) {
      setPassError(data.error || 'Failed');
      return;
    }
    setPassMsg('Password changed');
    e.currentTarget.reset();
  }

  return (
    <div className="settings-grid">
      <section>
        <h2 className="section-title">Profile</h2>
        <form className="form-stack" onSubmit={saveProfile}>
          <label className="form-field">
            <span>First name</span>
            <input name="firstName" defaultValue={user.firstName} required />
          </label>
          <label className="form-field">
            <span>Last name</span>
            <input name="lastName" defaultValue={user.lastName} required />
          </label>
          <label className="form-field">
            <span>Personal ID</span>
            <input name="personalId" defaultValue={user.personalId} required pattern="\d{11}" />
          </label>
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
