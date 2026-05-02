import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { postsApi, Post } from '../../lib/api/posts';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const MapView = lazy(() => import('../../components/ui/MapView'));

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    postsApi
      .getOne(id)
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!post || !confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await postsApi.remove(post.id);
      navigate('/feed');
    } catch {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !post) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Post not found</h2>
          <Link to="/feed" className="btn btn-ghost btn-sm">← Back to feed</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === post.author.id;
  const canDelete = isOwner || isAdmin;

  return (
    <div className="page page-narrow">
      <Link to="/feed" className="back-link">← Feed</Link>

      <article className="post-detail">
        {post.images.length > 0 && (
          <div className="post-detail-images">
            {post.images.map((src, i) => (
              <img key={i} src={src} alt="" className="post-detail-img" />
            ))}
          </div>
        )}

        <div className="post-detail-body">
          <div className="post-detail-meta">
            <span className="post-detail-author">@{post.author.nickname}</span>
            <span className="post-detail-category">{post.category}</span>
            <time className="post-detail-date">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </time>
          </div>

          <p className="post-detail-content">{post.content}</p>

          {post.locationName && (
            <p className="post-detail-location">📍 {post.locationName}</p>
          )}

          {post.locationLat && post.locationLng && (
            <Suspense fallback={<div style={{ height: 280, background: '#f1f5f9', borderRadius: 12 }} />}>
              <MapView
                lat={post.locationLat}
                lng={post.locationLng}
                label={post.locationName ?? undefined}
              />
            </Suspense>
          )}

          {canDelete && (
            <div className="post-detail-actions">
              {isOwner && (
                <Link to={`/posts/${post.id}/edit`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
