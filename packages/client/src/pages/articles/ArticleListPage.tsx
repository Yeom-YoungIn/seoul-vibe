import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi, ArticleListItem } from '../../lib/api/articles';
import Spinner from '../../components/ui/Spinner';

const PAGE_SIZE = 12;

export default function ArticleListPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    articlesApi
      .getList({ language: 'EN', skip, take: PAGE_SIZE })
      .then((res) => {
        setArticles(res.list);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  }, [skip]);

  return (
    <div className="page">
      <section className="page-header">
        <h1>Seoul Vibes</h1>
        <p>Curated guides to Seoul&apos;s most interesting places.</p>
      </section>

      {loading ? (
        <Spinner />
      ) : articles.length === 0 ? (
        <p className="empty-state">No articles yet. Check back soon!</p>
      ) : (
        <>
          <div className="card-grid">
            {articles.map((a) => (
              <Link key={a.id} to={`/articles/${a.slug}`} className="article-card">
                <div className="article-card-body">
                  <h3>{a.title}</h3>
                  <span className="article-card-date">
                    {new Date(a.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={skip === 0}
              onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
            >
              ← Prev
            </button>
            <span className="pagination-info">
              {skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={skip + PAGE_SIZE >= count}
              onClick={() => setSkip((s) => s + PAGE_SIZE)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
