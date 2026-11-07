import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { HeaderTone } from '../../hooks/useHeaderTone';
import { CloseIcon, MenuIcon } from '../ui/Icon';

export default function NavBar({ tone }: { tone: HeaderTone }) {
  const { user, isAdmin, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className={`site-header tone-${tone}`}>
      <Link to="/" className="logo">
        seoul vibe
      </Link>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div id="site-menu" className="site-menu">
          <Link to="/" className="logo">
            seoul vibe
          </Link>
          <nav className="site-menu-nav">
            <NavLink to="/articles">Discover</NavLink>
            <NavLink to="/feed">Feed</NavLink>
            {user && <NavLink to="/posts/new">Share a spot</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="site-menu-foot">
            <div className="lang-switch" role="group" aria-label="Language">
              {(['EN', 'KO'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={language === lang ? 'active' : ''}
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="site-menu-account">
              {user ? (
                <>
                  <span>{user.nickname}</span>
                  <button type="button" className="text-button" onClick={handleLogout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login">Log in</Link>
                  <Link to="/auth/signup" className="btn btn-lime">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
