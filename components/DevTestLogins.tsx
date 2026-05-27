export function DevTestLogins() {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <aside className="dev-test-logins" aria-label="Test accounts">
      <p className="dev-test-logins__title">Test accounts (dev only)</p>
      <table>
        <tbody>
          <tr>
            <th>Admin</th>
            <td>admin@sabagiro.test</td>
            <td>SabagiroAdmin2026!</td>
            <td>
              <a href="/admin">/admin</a>
            </td>
          </tr>
          <tr>
            <th>User</th>
            <td>user@sabagiro.test</td>
            <td>SabagiroUser2026!</td>
            <td>
              <a href="/account">/account</a>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="dev-test-logins__hint">Run once: npm run setup:db (needs Railway DATABASE_URL in .env.local)</p>
    </aside>
  );
}
