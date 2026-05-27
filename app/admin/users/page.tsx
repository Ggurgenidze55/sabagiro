import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Users — Admin' };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <>
      <h1 className="page-title">USERS</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Personal ID</th>
            <th>Role</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.personalId}</td>
              <td>{u.role}</td>
              <td>{u._count.tickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
