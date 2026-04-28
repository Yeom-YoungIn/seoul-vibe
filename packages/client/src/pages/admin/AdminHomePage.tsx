import { useEffect, useState } from 'react';
import { articlesApi } from '../../lib/api/articles';
import { postsApi } from '../../lib/api/posts';

interface AdminStats {
  articles: number;
  posts: number;
  users: string;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats>({
    articles: 0,
    posts: 0,
    users: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      articlesApi.getList({ take: 1 }),
      postsApi.getFeed({ take: 1 }),
    ])
      .then(([articles, posts]) => {
        setStats({
          articles: articles.count,
          posts: posts.count,
          users: 'N/A',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </header>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : (
        <div className="admin-stat-grid">
          <article className="stat-card">
            <div className="stat-card-label">Articles</div>
            <div className="stat-card-value">{stats.articles}</div>
          </article>
          <article className="stat-card">
            <div className="stat-card-label">Posts</div>
            <div className="stat-card-value">{stats.posts}</div>
          </article>
          <article className="stat-card">
            <div className="stat-card-label">Users</div>
            <div className="stat-card-value">{stats.users}</div>
          </article>
        </div>
      )}
    </section>
  );
}
