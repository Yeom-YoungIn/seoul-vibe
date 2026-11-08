import { Link } from 'react-router-dom';
import { useLocalePath } from '../../hooks/useLanguage';

export default function Footer() {
  const lp = useLocalePath();
  return (
    <footer className="site-footer">
      <Link to={lp('/')} className="logo logo-lg">
        seoul vibe
      </Link>
      <p className="site-footer-line">
        Local restaurants, indie cafés, and off-the-beaten-path spots, curated by people who live
        here.
      </p>
      <nav className="site-footer-nav">
        <Link to={lp('/articles')}>Discover</Link>
        <Link to={lp('/feed')}>Feed</Link>
        <Link to={lp('/posts/new')}>Share a spot</Link>
      </nav>
      <p className="site-footer-copy">© {new Date().getFullYear()} Seoul Vibe</p>
    </footer>
  );
}
