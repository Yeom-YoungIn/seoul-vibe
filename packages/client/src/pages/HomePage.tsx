import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi, ArticleListItem } from '../lib/api/articles';
import { postsApi, Post } from '../lib/api/posts';
import Spinner from '../components/ui/Spinner';

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      articlesApi.getList({ language: 'EN', take: 4 }),
      postsApi.getFeed({ take: 6 }),
    ])
      .then(([articleRes, postRes]) => {
        setArticles(articleRes.list);
        setPosts(postRes.list);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <p className="eyebrow">Seoul&apos;s hidden gems</p>
        <h1>Discover the real Seoul</h1>
        <p className="hero-desc">
          Local restaurants, indie cafés, and off-the-beaten-path spots — curated by people who live here.
        </p>
        <div className="hero-actions">
          <Link to="/articles" className="btn btn-primary">Explore spots</Link>
          <Link to="/feed" className="btn btn-ghost">See the feed</Link>
        </div>
      </section>

      {/* Articles */}
      {articles.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Seoul Vibes</h2>
            <Link to="/articles" className="section-more">See all →</Link>
          </div>
          <div className="card-grid">
            {articles.map((a) => (
              <Link key={a.id} to={`/articles/${a.slug}`} className="article-card">
                <div className="article-card-body">
                  <h3>{a.title}</h3>
                  <span className="article-card-date">
                    {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feed */}
      {posts.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>From the community</h2>
            <Link to="/feed" className="section-more">See all →</Link>
          </div>
          <div className="post-grid">
            {posts.map((p) => (
              <Link key={p.id} to={`/posts/${p.id}`} className="post-card">
                {p.images[0] && (
                  <img src={p.images[0]} alt="" className="post-card-img" />
                )}
                <div className="post-card-body">
                  <span className="post-card-author">@{p.author.nickname}</span>
                  <p className="post-card-content">{p.content}</p>
                  {p.locationName && (
                    <span className="post-card-location">📍 {p.locationName}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
