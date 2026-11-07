import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi, Post, PostCategory } from '../../lib/api/posts';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderTone } from '../../hooks/useHeaderTone';
import Spinner from '../../components/ui/Spinner';
import PostCard from '../../components/ui/PostCard';

const PAGE_SIZE = 20;

const CATEGORIES: { value: PostCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'etc', label: 'Other' },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<PostCategory | ''>('');
  const skipRef = useRef(0);
  const loadingRef = useRef(false);
  useHeaderTone('light');

  const loadMore = useCallback(
    (reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      const skip = reset ? 0 : skipRef.current;
      postsApi
        .getFeed({ category: category || undefined, skip, take: PAGE_SIZE })
        .then((res) => {
          setPosts((prev) => (reset ? res.list : [...prev, ...res.list]));
          skipRef.current = skip + res.list.length;
          setHasMore(skip + res.list.length < res.count);
        })
        .finally(() => {
          loadingRef.current = false;
          setLoading(false);
        });
    },
    [category]
  );

  useEffect(() => {
    skipRef.current = 0;
    loadMore(true);
  }, [category, loadMore]);

  return (
    <section className="split">
      <aside className="split-side">
        <div className="panel surface-ink">
          <h1 className="panel-title">Community Feed</h1>
          <p className="panel-desc">See what people are discovering in Seoul.</p>
          <div className="filter-list" role="group" aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={category === c.value ? 'active' : ''}
                aria-pressed={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Link to={user ? '/posts/new' : '/auth/login'} className="btn btn-lime">
            Share a spot
          </Link>
        </div>
      </aside>

      <div className="split-main surface-paper">
        {posts.length > 0 && (
          <div className="stagger">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {loading && <Spinner />}

        {!loading && posts.length === 0 && (
          <div className="empty-block">
            <h2>No posts yet.</h2>
            <p>Be the first to share a spot.</p>
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <div className="load-more">
            <button type="button" className="btn btn-primary" onClick={() => loadMore()}>
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
