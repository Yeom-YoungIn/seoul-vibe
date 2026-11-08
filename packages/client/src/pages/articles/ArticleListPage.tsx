import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi, ArticleListItem } from '../../lib/api/articles';
import { formatDate } from '../../lib/format';
import Spinner from '../../components/ui/Spinner';
import { ArrowIcon } from '../../components/ui/Icon';
import { useLanguage, useLocalePath } from '../../hooks/useLanguage';
import { useHeaderTone } from '../../hooks/useHeaderTone';

const PAGE_SIZE = 12;

export default function ArticleListPage() {
  const lp = useLocalePath();
  const { language } = useLanguage();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  useHeaderTone('dark');

  useEffect(() => {
    setLoading(true);
    articlesApi
      .getList({ language, skip, take: PAGE_SIZE })
      .then((res) => {
        setArticles(res.list);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  }, [skip, language]);

  return (
    <section className="split">
      <aside className="split-side">
        <div className="panel surface-lime">
          <h1 className="panel-title">Seoul Vibes</h1>
          <p className="panel-desc">Curated guides to Seoul&apos;s most interesting places.</p>
          {count > PAGE_SIZE && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              >
                Prev
              </button>
              <span className="pagination-info">
                {skip + 1}–{Math.min(skip + PAGE_SIZE, count)} / {count}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={skip + PAGE_SIZE >= count}
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="split-main surface-paper">
        {loading ? (
          <Spinner />
        ) : articles.length === 0 ? (
          <div className="empty-block">
            <h2>No guides yet.</h2>
            <p>Check back soon.</p>
          </div>
        ) : (
          <ol className="article-rows">
            {articles.map((a) => (
              <li key={a.id}>
                <Link to={lp(`/articles/${a.slug}`)} className="article-row">
                  <time>{formatDate(a.createdAt)}</time>
                  <h2>{a.title}</h2>
                  <ArrowIcon size={28} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
