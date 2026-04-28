import { useEffect, useState } from 'react';
import { ArticleListItem, articlesApi } from '../../lib/api/articles';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articlesApi
      .getList({ take: 50 })
      .then((data) => {
        setArticles(data.list);
        setCount(data.count);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">
          Articles <span className="admin-count">{count}</span>
        </h1>
      </header>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td className="td-slug">{article.slug}</td>
                  <td>
                    <span className={`status-badge ${article.isPublished ? 'published' : 'draft'}`}>
                      {article.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={4}>No articles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
