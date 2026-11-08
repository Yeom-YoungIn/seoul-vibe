import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articlesApi, Article } from '../../lib/api/articles';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/ui/Spinner';
import { useLanguage, useLocalePath } from '../../hooks/useLanguage';
import { localePath } from '../../lib/locale';
import ArticleSource from '../../components/ui/ArticleSource';
import { useHeaderTone } from '../../hooks/useHeaderTone';

const MISSING_COPY = {
  EN: { text: 'Not available in English yet.', other: 'Read it in Korean →' },
  KO: { text: '아직 한국어 버전이 없습니다.', other: '영어로 보기 →' },
};

export default function ArticleDetailPage() {
  const lp = useLocalePath();
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 현재 언어로 404일 때 다른 언어 번역이 실제로 있는지 (있을 때만 그쪽으로 안내)
  const [otherExists, setOtherExists] = useState(false);
  const other = language === 'EN' ? 'KO' : 'EN';
  useHeaderTone(article ? 'night' : 'dark');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    setOtherExists(false);
    articlesApi
      .getDetail(slug, language)
      .then(setArticle)
      .catch(() =>
        articlesApi
          .getDetail(slug, other)
          .then(() => setOtherExists(true))
          .catch(() => setOtherExists(false))
          .finally(() => setError(true)),
      )
      .finally(() => setLoading(false));
  }, [slug, language, other]);

  useEffect(() => {
    const title = article?.translations[0]?.title;
    if (title) document.title = `${title} | Seoul Vibe`;
  }, [article]);

  if (loading)
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );

  if (error || !article) {
    // 상세 API는 해당 언어 번역이 없을 때도 404이므로, 다른 언어 번역이 있으면 그쪽으로 안내한다
    const missing = MISSING_COPY[language];
    return (
      <div className="page-loading">
        <div className="empty-block">
          <h2>{otherExists ? missing.text : 'Article not found.'}</h2>
          {slug && otherExists && (
            <Link to={localePath(other, `/articles/${slug}`)} className="btn btn-primary btn-sm">
              {missing.other}
            </Link>
          )}
          <Link to={lp('/articles')} className="btn btn-ghost btn-sm">
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
        <ArticleSource source={article} />
      </div>
    </article>
  );
}
