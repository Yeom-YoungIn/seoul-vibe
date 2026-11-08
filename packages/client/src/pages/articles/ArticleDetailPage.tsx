import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articlesApi, Article } from '../../lib/api/articles';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/ui/Spinner';
import { useLanguage, useLocalePath } from '../../hooks/useLanguage';
import { useHeaderTone } from '../../hooks/useHeaderTone';

export default function ArticleDetailPage() {
  const lp = useLocalePath();
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useHeaderTone(article ? 'night' : 'dark');

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .getDetail(slug, language)
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, language]);

  if (loading)
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );

  if (error || !article) {
    return (
      <div className="page-loading">
        <div className="empty-block">
          <h2>Article not found.</h2>
          <Link to={lp('/articles')} className="btn btn-primary btn-sm">
            Back to guides
          </Link>
        </div>
      </div>
    );
  }

  const translation = article.translations[0];

  return (
    <article>
      <header className="article-hero">
        <Link to={lp('/articles')} className="label article-hero-back">
          Seoul Vibes
        </Link>
        <h1>{translation?.title ?? article.slug}</h1>
        <time>{formatDate(article.createdAt)}</time>
      </header>

      <div className="article-body-wrap">
        {translation?.bodyHtml ? (
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: translation.bodyHtml }}
          />
        ) : translation?.bodyText ? (
          <div className="article-body">
            {translation.bodyText.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="muted">No content available in this language yet.</p>
        )}
      </div>
    </article>
  );
}
