import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminArticlesApi, adminPostsApi, adminUsersApi } from '../../lib/api/admin';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  users: number;
  articles: number;
  posts: number;
  hiddenPosts: number;
}

export default function AdminHomePage() {
  const { user } = useAuth();
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
    {
      label: 'Total users',
      value: stats?.users,
      to: '/admin/users',
      accent: 'indigo',
      note: 'Accounts registered across the platform',
    },
    {
      label: 'Articles',
      value: stats?.articles,
      to: '/admin/articles',
      accent: 'teal',
      note: 'Editorial entries in draft and published states',
    },
    {
      label: 'Community posts',
      value: stats?.posts,
      to: '/admin/posts',
      accent: 'amber',
      note: 'Visible and moderated posts from the feed',
    },
    {
      label: 'Hidden posts',
      value: stats?.hiddenPosts,
      to: '/admin/posts?isHidden=true',
      accent: 'rose',
      note: 'Posts currently removed from public view',
    },
  ] as const;

  const operationalItems = [
    {
      title: 'Review member accounts',
      description: 'Inspect verification status, delete unwanted accounts, and assign roles.',
      to: '/admin/users',
    },
    {
      title: 'Publish editorial content',
      description: 'Open drafts, adjust translations, and ship new articles.',
      to: '/admin/articles',
    },
    {
      title: 'Moderate the feed',
      description: 'Hide or remove problem posts without leaving the admin workspace.',
      to: '/admin/posts',
    },
  ];

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <h1 className="admin-page-title">Operations overview</h1>
          <p className="admin-hero-text">
            {user?.nickname ?? 'Admin'} is signed in. Use this workspace to manage users, publish
            content, and moderate community activity.
          </p>
        </div>

        <div className="admin-hero-panel">
          <span className="admin-hero-panel-label">Current focus</span>
          <strong>{stats?.hiddenPosts ?? 0} posts need moderation visibility</strong>
          <Link to="/admin/posts?isHidden=true" className="btn btn-primary btn-sm">
            Review hidden posts
          </Link>
        </div>
      </section>

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`admin-stat-card admin-stat-card-${card.accent}`}
          >
            <span className="admin-stat-label">{card.label}</span>
            <span className="admin-stat-value">{stats === null ? '…' : card.value}</span>
            <span className="admin-stat-note">{card.note}</span>
            <span className="admin-stat-link">Open section</span>
          </Link>
        ))}
      </div>

      <section className="admin-overview-grid">
        <div className="admin-overview-card">
          <div className="admin-section-heading">
            <h2>Admin workflow</h2>
            <span>Primary routes</span>
          </div>
          <div className="admin-action-list">
            {operationalItems.map((item) => (
              <Link key={item.title} to={item.to} className="admin-action-card">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-overview-card">
          <div className="admin-section-heading">
            <h2>Snapshot</h2>
            <span>Fast health check</span>
          </div>
          <div className="admin-kpi-list">
            <div className="admin-kpi-item">
              <span>Users</span>
              <strong>{stats?.users ?? '…'}</strong>
            </div>
            <div className="admin-kpi-item">
              <span>Articles in system</span>
              <strong>{stats?.articles ?? '…'}</strong>
            </div>
            <div className="admin-kpi-item">
              <span>Moderation backlog</span>
              <strong>{stats?.hiddenPosts ?? '…'}</strong>
            </div>
            <div className="admin-kpi-item">
              <span>Community feed items</span>
              <strong>{stats?.posts ?? '…'}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
