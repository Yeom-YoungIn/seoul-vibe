import { useEffect, useState } from 'react';
import { adminPostsApi } from '../../lib/api/admin';
import { Post } from '../../lib/api/posts';

const PAGE_SIZE = 20;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isHidden, setIsHidden] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminPostsApi
      .getList({ isHidden, skip, take: PAGE_SIZE })
      .then((res) => { setPosts(res.list); setCount(res.count); })
      .finally(() => setLoading(false));
  }, [skip, isHidden]);

  const handleHideToggle = async (post: Post & { isHidden?: boolean }) => {
    const updated = post.isHidden
      ? await adminPostsApi.unhide(post.id)
      : await adminPostsApi.hide(post.id);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await adminPostsApi.remove(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setCount((c) => c - 1);
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Posts <span className="admin-count">{count}</span></h1>

      <div className="admin-filter-row">
        {[
          { label: 'All', val: undefined },
          { label: 'Visible', val: false },
          { label: 'Hidden', val: true },
        ].map((f) => (
          <button
            key={String(f.val)}
            className={`filter-chip ${isHidden === f.val ? 'active' : ''}`}
            onClick={() => { setIsHidden(f.val); setSkip(0); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Content</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const post = p as Post & { isHidden?: boolean };
                return (
                  <tr key={p.id} className={post.isHidden ? 'row-hidden' : ''}>
                    <td>@{p.author.nickname}</td>
                    <td className="td-content">{p.content}</td>
                    <td>{p.category}</td>
                    <td>
                      <span className={`status-badge ${post.isHidden ? 'hidden' : 'visible'}`}>
                        {post.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="td-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleHideToggle(post)}
                      >
                        {post.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="btn btn-ghost btn-sm" disabled={skip === 0} onClick={() => setSkip((s) => s - PAGE_SIZE)}>← Prev</button>
        <span className="pagination-info">{skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}</span>
        <button className="btn btn-ghost btn-sm" disabled={skip + PAGE_SIZE >= count} onClick={() => setSkip((s) => s + PAGE_SIZE)}>Next →</button>
      </div>
    </div>
  );
}
