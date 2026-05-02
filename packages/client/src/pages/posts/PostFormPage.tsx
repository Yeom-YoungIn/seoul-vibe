import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, PostCategory, CreatePostPayload } from '../../lib/api/posts';
import { uploadApi } from '../../lib/api/upload';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreatePostPayload>({
    content: '',
    images: [],
    category: 'etc',
    locationName: '',
  });
  const [uploading, setUploading] = useState(false);
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = await Promise.all(files.map((f) => uploadApi.uploadImage(f)));
      setForm((f) => ({ ...f, images: [...(f.images ?? []), ...urls] }));
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: (f.images ?? []).filter((_, i) => i !== idx) }));
  };

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
          Photos
          <div className="image-upload-area">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '+ Add photos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <span className="upload-hint">JPG, PNG, GIF, WEBP · max 5 MB each</span>
          </div>

          {(form.images ?? []).length > 0 && (
            <div className="image-preview-grid">
              {(form.images ?? []).map((url, i) => (
                <div key={i} className="image-preview-item">
                  <img src={url} alt="" className="image-preview-thumb" />
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={() => removeImage(i)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" disabled={loading || uploading} className="btn btn-primary">
            {loading ? 'Saving…' : mode === 'create' ? 'Post' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
