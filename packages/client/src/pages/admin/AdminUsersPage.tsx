import { useCallback, useEffect, useState } from 'react';
import { adminUsersApi, AdminUser, UserRole } from '../../lib/api/admin';

const PAGE_SIZE = 20;

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function getInitials(nickname: string, email: string) {
  const source = nickname.trim() || email.trim();
  return source.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (s = skip, q = appliedSearch) => {
      setLoading(true);
      adminUsersApi
        .getList({ email: q || undefined, skip: s, take: PAGE_SIZE })
        .then((res) => {
          setUsers(res.list);
          setCount(res.count);
        })
        .finally(() => setLoading(false));
    },
    [appliedSearch, skip]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    setAppliedSearch(search);
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

  const verifiedCount = users.filter((user) => user.isEmailVerified).length;
  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <div className="admin-page">
      <section className="admin-users-hero">
        <div>
          <h1 className="admin-page-title">
            Users <span className="admin-count">{count}</span>
          </h1>
          <p className="admin-users-subtitle">
            Review account trust signals, adjust permissions, and remove unwanted members.
          </p>
        </div>
        <div className="admin-users-kpis">
          <div className="admin-users-kpi-card">
            <span>Verified in view</span>
            <strong>{loading ? '…' : verifiedCount}</strong>
          </div>
          <div className="admin-users-kpi-card">
            <span>Admins in view</span>
            <strong>{loading ? '…' : adminCount}</strong>
          </div>
        </div>
      </section>

      <form onSubmit={handleSearch} className="admin-search-row">
        <div className="admin-users-search-input">
          <input
            className="form-input"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit">
          Search
        </button>
        {search && (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => {
              setSearch('');
              setSkip(0);
              setAppliedSearch('');
            }}
          >
            Clear
          </button>
        )}
      </form>

      <div className="admin-users-toolbar">
        <p className="admin-users-toolbar-copy">
          {appliedSearch
            ? `Showing results for "${appliedSearch}"`
            : 'Showing the most recent user accounts first'}
        </p>
        <span className="admin-users-toolbar-range">
          {count === 0 ? '0 users' : `${skip + 1}-${Math.min(skip + PAGE_SIZE, count)} of ${count}`}
        </span>
      </div>

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : users.length === 0 ? (
        <div className="admin-empty-state">
          <strong>No users found</strong>
          <p>Try a different email keyword or clear the current search.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Country</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{getInitials(u.nickname, u.email)}</div>
                      <div className="admin-user-meta">
                        <strong>{u.nickname}</strong>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </td>
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
                  <td>
                    <span className={`status-badge ${u.isEmailVerified ? 'visible' : 'draft'}`}>
                      {u.isEmailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className="admin-user-country">{u.nationality ?? '—'}</span>
                  </td>
                  <td>
                    <div className="admin-user-date">
                      <strong>{formatJoinedDate(u.createdAt)}</strong>
                      <span>
                        {new Date(u.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemove(u)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button
          className="btn btn-ghost btn-sm"
          disabled={skip === 0}
          onClick={() => setSkip((s) => s - PAGE_SIZE)}
        >
          Prev
        </button>
        <span className="pagination-info">
          {skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={skip + PAGE_SIZE >= count}
          onClick={() => setSkip((s) => s + PAGE_SIZE)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
