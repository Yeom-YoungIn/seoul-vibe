import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminUsersApi } from '../../lib/api/admin';
import { adminArticlesApi } from '../../lib/api/admin';
import { adminPostsApi } from '../../lib/api/admin';

interface Stats {
  users: number;
  articles: number;
  posts: number;
  hiddenPosts: number;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      adminUsersApi.getList({ take: 1 }),
      adminArticlesApi.getList({ take: 1 }),
      adminPostsApi.getList({ take: 1 }),
      adminPostsApi.getList({ isHidden: true, take: 1 }),
    ]).then(([users, articles, posts, hidden]) => {
      setStats({
        users: users.count,
        articles: articles.count,
        posts: posts.count,
        hiddenPosts: hidden.count,
      });
    });
  }, []);

  const cards = [
    { label: 'Total users', value: stats?.users, to: '/admin/users', color: '#6366f1' },
    { label: 'Articles', value: stats?.articles, to: '/admin/articles', color: '#14b8a6' },
    { label: 'Community posts', value: stats?.posts, to: '/admin/posts', color: '#f59e0b' },
    { label: 'Hidden posts', value: stats?.hiddenPosts, to: '/admin/posts?isHidden=true', color: '#ef4444' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Overview</h1>

      <div className="admin-stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="admin-stat-card">
            <span className="admin-stat-label">{c.label}</span>
            <span className="admin-stat-value" style={{ color: c.color }}>
              {stats === null ? '…' : c.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
