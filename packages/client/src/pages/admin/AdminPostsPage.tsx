import { useEffect, useState } from 'react';
import { Post, postsApi } from '../../lib/api/posts';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi
      .getFeed({ take: 50 })
      .then((data) => {
        setPosts(data.list);
        setCount(data.count);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">
          Posts <span className="admin-count">{count}</span>
        </h1>
      </header>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Category</th>
                <th>Content</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.author.nickname}</td>
                  <td>{post.category}</td>
                  <td>{post.content.slice(0, 80)}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4}>No posts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
