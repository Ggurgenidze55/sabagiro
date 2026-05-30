'use client';

type LogoutButtonProps = {
  variant?: 'button' | 'nav';
};

export function LogoutButton({ variant = 'button' }: LogoutButtonProps) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  if (variant === 'nav') {
    return (
      <button type="button" className="account-subnav__logout-btn" onClick={logout}>
        Log out
      </button>
    );
  }

  return (
    <button type="button" className="btn btn--ghost" onClick={logout}>
      Log out
    </button>
  );
}
