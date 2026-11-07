import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/" className="logo logo-lg">
        seoul vibe
      </Link>
      <p className="site-footer-line">
        Local restaurants, indie cafés, and off-the-beaten-path spots, curated by people who live
        here.
      </p>
      <nav className="site-footer-nav">
        <Link to="/articles">Discover</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/posts/new">Share a spot</Link>
      </nav>
      <p className="site-footer-copy">© {new Date().getFullYear()} Seoul Vibe</p>
    </footer>
  );
}
