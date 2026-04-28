import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/posts', label: 'Posts' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          Seoul Vibe
          <span className="admin-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'admin-nav-item active' : 'admin-nav-item'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <NavLink to="/" className="btn btn-ghost">
            View site
          </NavLink>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
