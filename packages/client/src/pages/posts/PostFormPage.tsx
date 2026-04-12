import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, PostCategory, CreatePostPayload } from '../../lib/api/posts';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'restaurant', label: '🍜 Restaurant' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'etc', label: '📍 Other' },
];

interface Props {
  mode: 'create' | 'edit';
}

export default function PostFormPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreatePostPayload>({
    content: '',
    images: [],
    category: 'etc',
    locationName: '',
  });
  const [imageInput, setImageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && id) {
      postsApi.getOne(id).then((post) => {
        setForm({
          content: post.content,
          images: post.images,
          category: post.category,
          locationName: post.locationName ?? '',
          locationLat: post.locationLat ?? undefined,
          locationLng: post.locationLng ?? undefined,
        });
      });
    }
  }, [mode, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'create') {
        const post = await postsApi.create(form);
        navigate(`/posts/${post.id}`);
      } else if (id) {
        await postsApi.update(id, form);
        navigate(`/posts/${id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to save post.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (!imageInput.trim()) return;
    setForm((f) => ({ ...f, images: [...(f.images ?? []), imageInput.trim()] }));
    setImageInput('');
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: (f.images ?? []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="page page-narrow">
      <h1>{mode === 'create' ? 'Share a spot' : 'Edit post'}</h1>

      <form onSubmit={handleSubmit} className="post-form">
        <label className="form-label">
          What did you find?
          <textarea
            className="form-textarea"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Tell the community about this place..."
            rows={5}
            required
            minLength={1}
            maxLength={2000}
          />
        </label>

        <label className="form-label">
          Category
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PostCategory }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Location name
          <input
            className="form-input"
            type="text"
            value={form.locationName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
            placeholder="e.g. Seongsu-dong café"
            maxLength={255}
          />
        </label>

        <div className="form-label">
          Image URLs
          <div className="image-input-row">
            <input
              className="form-input"
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="https://..."
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={addImage}>
              Add
            </button>
          </div>
          {(form.images ?? []).length > 0 && (
            <ul className="image-list">
              {(form.images ?? []).map((url, i) => (
                <li key={i} className="image-list-item">
                  <span className="image-list-url">{url}</span>
                  <button type="button" className="image-list-remove" onClick={() => removeImage(i)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving…' : mode === 'create' ? 'Post' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
