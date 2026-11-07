import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  to?: string;
  image?: string;
  label: string;
  title: string;
  excerpt?: string | null;
  date: string;
  byline?: ReactNode;
  // Without an image the cover falls back to a flat ink or lime panel.
  fallback?: 'ink' | 'lime';
  as?: 'h1' | 'h2';
}

export default function FeatureCover({
  to,
  image,
  label,
  title,
  excerpt,
  date,
  byline,
  fallback = 'ink',
  as: Heading = 'h2',
}: Props) {
  const body = (
    <>
      {image && <img src={image} alt="" className="feature-img" />}
      <div className="feature-body">
        <span className="label feature-label">{label}</span>
        <Heading className="feature-title">{title}</Heading>
        {excerpt && <p className="feature-excerpt">{excerpt}</p>}
        <div className="feature-foot">
          <time>{date}</time>
          {byline}
        </div>
      </div>
    </>
  );
  const className = `feature ${image ? 'has-image' : `is-${fallback}`}`;

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
