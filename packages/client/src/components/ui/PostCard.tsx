import { Link } from 'react-router-dom';
import { Post } from '../../lib/api/posts';
import { categoryLabel, formatDate, postTitle } from '../../lib/format';
import Byline from './Byline';
import { useLocalePath } from '../../hooks/useLanguage';

export default function PostCard({ post }: { post: Post }) {
  const lp = useLocalePath();
  return (
    <Link to={lp(`/posts/${post.id}`)} className="post-card">
      <div className={`post-card-media ${post.images[0] ? '' : 'is-empty'}`}>
        {post.images[0] && <img src={post.images[0]} alt="" loading="lazy" />}
        <span className="label post-card-label">{categoryLabel(post.category)}</span>
      </div>
      <h3 className="post-card-title">{postTitle(post.content)}</h3>
      {post.locationName && <p className="post-card-excerpt">{post.locationName}</p>}
      <div className="post-card-foot">
        <time>{formatDate(post.createdAt)}</time>
        <Byline author={post.author} />
      </div>
    </Link>
  );
}
