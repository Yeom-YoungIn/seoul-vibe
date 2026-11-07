import { PostAuthor } from '../../lib/api/posts';

interface Props {
  author: PostAuthor;
  size?: 'sm' | 'lg';
}

export default function Byline({ author, size = 'sm' }: Props) {
  return (
    <span className={`byline byline-${size}`}>
      {author.profileImage ? (
        <img src={author.profileImage} alt="" className="byline-avatar" />
      ) : (
        <span className="byline-avatar byline-initial" aria-hidden="true">
          {author.nickname.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="byline-name">{author.nickname}</span>
    </span>
  );
}
