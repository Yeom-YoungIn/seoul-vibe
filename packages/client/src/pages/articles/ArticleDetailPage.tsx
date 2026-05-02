import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articlesApi, Article } from '../../lib/api/articles';
import Spinner from '../../components/ui/Spinner';
import { useLanguage } from '../../hooks/useLanguage';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .getDetail(slug, language)
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, language]);

  if (loading) return <Spinner />;

  if (error || !article) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Article not found</h2>
          <Link to="/articles" className="btn btn-ghost btn-sm">← Back to articles</Link>
        </div>
      </div>
    );
  }

  const translation = article.translations[0];

  return (
    <div className="page page-narrow">
      <Link to="/articles" className="back-link">← Seoul Vibes</Link>

      <article className="article-detail">
        <header className="article-detail-header">
          <h1>{translation?.title ?? article.slug}</h1>
          <time className="article-detail-date">
            {new Date(article.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </header>

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
          <p className="empty-state">No content available.</p>
        )}
      </article>
    </div>
  );
}
