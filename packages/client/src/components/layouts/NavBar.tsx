import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">Seoul Vibe</Link>
      <nav className="navbar-nav">
        <Link to="/articles" className="navbar-link">Discover</Link>
        <Link to="/feed" className="navbar-link">Feed</Link>
      </nav>
      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/posts/new" className="btn btn-primary btn-sm">+ Post</Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/auth/signup" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
