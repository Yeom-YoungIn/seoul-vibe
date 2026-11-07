import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/posts', label: 'Posts' },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            <span className="logo">seoul vibe</span>
            <span className="admin-badge">Admin</span>
          </div>
          <div className="admin-sidebar-meta">
            <strong>{user?.nickname ?? 'Administrator'}</strong>
            <span>{user?.email ?? 'Admin session'}</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
          <NavLink to="/" className="btn btn-ghost btn-sm" target="_blank">
            View site
          </NavLink>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
