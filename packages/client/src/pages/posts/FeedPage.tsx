import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi, Post, PostCategory } from '../../lib/api/posts';
import Spinner from '../../components/ui/Spinner';

const PAGE_SIZE = 20;

const CATEGORIES: { value: PostCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'restaurant', label: '🍜 Restaurant' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'etc', label: '📍 Other' },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<PostCategory | ''>('');
  const skipRef = useRef(0);

  const loadMore = (reset = false) => {
    if (loading) return;
    setLoading(true);
    const skip = reset ? 0 : skipRef.current;
    postsApi
      .getFeed({ category: category || undefined, skip, take: PAGE_SIZE })
      .then((res) => {
        setPosts((prev) => (reset ? res.list : [...prev, ...res.list]));
        skipRef.current = skip + res.list.length;
        setHasMore(skip + res.list.length < res.count);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    skipRef.current = 0;
    loadMore(true);
  }, [category]);

  return (
    <div className="page">
      <section className="page-header">
        <h1>Community Feed</h1>
        <p>See what people are discovering in Seoul.</p>
      </section>

      {/* Category filter */}
      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`filter-chip ${category === c.value ? 'active' : ''}`}
            onClick={() => setCategory(c.value as PostCategory | '')}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="feed">
        {posts.map((post) => (
          <Link key={post.id} to={`/posts/${post.id}`} className="feed-card">
            {post.images.length > 0 && (
              <img src={post.images[0]} alt="" className="feed-card-img" />
            )}
            <div className="feed-card-body">
              <div className="feed-card-meta">
                <span className="feed-card-author">@{post.author.nickname}</span>
                <span className="feed-card-category">{post.category}</span>
              </div>
              <p className="feed-card-content">{post.content}</p>
              {post.locationName && (
                <span className="feed-card-location">📍 {post.locationName}</span>
              )}
              <span className="feed-card-date">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && posts.length === 0 && (
        <p className="empty-state">No posts yet. Be the first to share a spot!</p>
      )}

      {!loading && hasMore && (
        <div className="load-more">
          <button className="btn btn-ghost" onClick={() => loadMore()}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
