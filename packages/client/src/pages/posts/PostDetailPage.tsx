import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { postsApi, Post } from '../../lib/api/posts';
import { categoryLabel, formatDate, postTitle } from '../../lib/format';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderTone } from '../../hooks/useHeaderTone';
import Spinner from '../../components/ui/Spinner';
import FeatureCover from '../../components/ui/FeatureCover';
import Byline from '../../components/ui/Byline';
import { PinIcon } from '../../components/ui/Icon';

const MapView = lazy(() => import('../../components/ui/MapView'));

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  useHeaderTone(post?.images.length ? 'light' : 'dark');

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

  if (loading)
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );
  if (error || !post) {
    return (
      <div className="page-loading">
        <div className="empty-block">
          <h2>Post not found.</h2>
          <Link to="/feed" className="btn btn-primary btn-sm">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === post.author.id;
  const canDelete = isOwner || isAdmin;
  const [cover, ...moreImages] = post.images;

  return (
    <article className="split">
      <div className="split-side">
        <FeatureCover
          image={cover}
          label={categoryLabel(post.category)}
          title={postTitle(post.content)}
          excerpt={post.locationName}
          date={formatDate(post.createdAt)}
          byline={<Byline author={post.author} size="lg" />}
          fallback="lime"
          as="h1"
        />
      </div>

      <div className="split-main surface-paper post-detail">
        <Link to="/feed" className="back-link">
          Community Feed
        </Link>

        <p className="post-detail-content">{post.content}</p>

        {post.locationName && (
          <p className="post-detail-location">
            <PinIcon size={18} /> {post.locationName}
          </p>
        )}

        {post.locationLat && post.locationLng && (
          <Suspense fallback={<div className="map-placeholder" style={{ height: 280 }} />}>
            <MapView
              lat={post.locationLat}
              lng={post.locationLng}
              label={post.locationName ?? undefined}
            />
          </Suspense>
        )}

        {moreImages.length > 0 && (
          <div className="post-detail-images">
            {moreImages.map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>
        )}

        {canDelete && (
          <div className="post-detail-actions">
            {isOwner && (
              <Link to={`/posts/${post.id}/edit`} className="btn btn-ghost btn-sm">
                Edit
              </Link>
            )}
            <button
              type="button"
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
  );
}
