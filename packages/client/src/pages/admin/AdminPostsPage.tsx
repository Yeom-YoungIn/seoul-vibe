import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminPost, adminPostsApi } from '../../lib/api/admin';

const PAGE_SIZE = 20;

function parseHiddenFilter(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export default function AdminPostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isHidden, setIsHidden] = useState<boolean | undefined>(() =>
    parseHiddenFilter(searchParams.get('isHidden')),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHidden(parseHiddenFilter(searchParams.get('isHidden')));
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    adminPostsApi
      .getList({ isHidden, skip, take: PAGE_SIZE })
      .then((res) => { setPosts(res.list); setCount(res.count); })
      .finally(() => setLoading(false));
  }, [skip, isHidden]);

  const handleHideToggle = async (post: AdminPost) => {
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
            onClick={() => {
              setIsHidden(f.val);
              setSkip(0);

              if (f.val === undefined) {
                setSearchParams({});
                return;
              }

              setSearchParams({ isHidden: String(f.val) });
            }}
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
              {posts.map((post) => (
                <tr key={post.id} className={post.isHidden ? 'row-hidden' : ''}>
                  <td>@{post.author.nickname}</td>
                  <td className="td-content">{post.content}</td>
                  <td>{post.category}</td>
                  <td>
                    <span className={`status-badge ${post.isHidden ? 'hidden' : 'visible'}`}>
                      {post.isHidden ? 'Hidden' : 'Visible'}
                    </span>
                  </td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="td-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleHideToggle(post)}
                    >
                      {post.isHidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(post.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
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
