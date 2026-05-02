import { useEffect, useState } from 'react';
import { adminUsersApi, AdminUser, UserRole } from '../../lib/api/admin';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (s = skip, q = search) => {
    setLoading(true);
    adminUsersApi
      .getList({ email: q || undefined, skip: s, take: PAGE_SIZE })
      .then((res) => { setUsers(res.list); setCount(res.count); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [skip]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    load(0, search);
  };

  const handleRoleChange = async (user: AdminUser, role: UserRole) => {
    if (!confirm(`Change ${user.email} role to "${role}"?`)) return;
    const updated = await adminUsersApi.changeRole(user.id, role);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleRemove = async (user: AdminUser) => {
    if (!confirm(`Remove user ${user.email}? This cannot be undone.`)) return;
    await adminUsersApi.remove(user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setCount((c) => c - 1);
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Users <span className="admin-count">{count}</span></h1>

      <form onSubmit={handleSearch} className="admin-search-row">
        <input
          className="form-input"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
      </form>

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nickname</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.nickname}</td>
                  <td>
                    <select
                      className="admin-role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.isEmailVerified ? '✅' : '❌'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(u)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="btn btn-ghost btn-sm" disabled={skip === 0} onClick={() => setSkip((s) => s - PAGE_SIZE)}>← Prev</button>
        <span className="pagination-info">{skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}</span>
        <button className="btn btn-ghost btn-sm" disabled={skip + PAGE_SIZE >= count} onClick={() => setSkip((s) => s + PAGE_SIZE)}>Next →</button>
      </div>
    </div>
  );
}
