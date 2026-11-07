import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-split">
      <aside className="auth-side">
        <Link to="/" className="logo">
          seoul vibe
        </Link>
        <p className="auth-side-title">Discover the real Seoul</p>
        <p className="auth-side-desc">
          Local restaurants, indie cafés, and off-the-beaten-path spots, curated by people who live
          here.
        </p>
      </aside>
      <div className="auth-main">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
