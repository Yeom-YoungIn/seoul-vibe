import type { ArticleSource as ArticleSourceData } from '../../lib/api/articles';
import { assetUrl } from '../../lib/axios';
import { useLanguage } from '../../hooks/useLanguage';
import InstagramEmbed from './InstagramEmbed';

const COPY = {
  EN: { label: 'Source', view: 'View original →' },
  KO: { label: '원문', view: '원문 보기 →' },
};

export default function ArticleSource({ source }: { source: ArticleSourceData }) {
  const { language } = useLanguage();
  if (!source.sourceUrl) return null;

  const copy = COPY[language];
  const credit = [source.sourceAuthor, source.sourceSiteName].filter(Boolean).join(' · ');

  return (
    <aside className="article-source" aria-label={copy.label}>
      <div className="article-source-head">
        <span className="label">{copy.label}</span>
        {credit && <span className="article-source-credit">{credit}</span>}
      </div>

      {source.sourceType === 'INSTAGRAM' ? (
        <div className="article-source-embed">
          <InstagramEmbed url={source.sourceUrl} />
        </div>
      ) : (
        <a className="source-card" href={source.sourceUrl} target="_blank" rel="noopener">
          {source.sourceImagePath && (
            <img
              className="source-card-thumb"
              src={assetUrl(source.sourceImagePath)}
              alt=""
              loading="lazy"
            />
          )}
          <span className="source-card-body">
            <strong className="source-card-title">{source.sourceTitle ?? source.sourceUrl}</strong>
            {source.sourceDescription && (
              <span className="source-card-desc">{source.sourceDescription}</span>
            )}
            {source.sourceSiteName && (
              <span className="source-card-site">{source.sourceSiteName}</span>
            )}
          </span>
        </a>
      )}

      <a className="article-source-link" href={source.sourceUrl} target="_blank" rel="noopener">
        {copy.view}
      </a>
    </aside>
  );
}
