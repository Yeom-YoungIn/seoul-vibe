import { ChangeEvent, FormEvent, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi, PostCategory, CreatePostPayload } from '../../lib/api/posts';
import { uploadApi } from '../../lib/api/upload';
import { getApiErrorMessage } from '../../lib/api/error';
import { useHeaderTone } from '../../hooks/useHeaderTone';
import { CloseIcon } from '../../components/ui/Icon';
import { useLocalePath } from '../../hooks/useLanguage';

const LocationPicker = lazy(() => import('../../components/ui/LocationPicker'));

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'etc', label: 'Other' },
];

interface Props {
  mode: 'create' | 'edit';
}

export default function PostFormPage({ mode }: Props) {
  const lp = useLocalePath();
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
  useHeaderTone('dark');

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
        navigate(lp(`/posts/${post.id}`));
      } else if (id) {
        await postsApi.update(id, form);
        navigate(lp(`/posts/${id}`));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save post.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="split">
      <aside className="split-side">
        <div className="panel surface-lime">
          <h1 className="panel-title">{mode === 'create' ? 'Share a spot' : 'Edit post'}</h1>
          <p className="panel-desc">
            A few honest lines, a photo or two, and a pin on the map are all it takes.
          </p>
        </div>
      </aside>

      <div className="split-main surface-paper">
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
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
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
            Location on map <span className="upload-hint">(선택)</span>
            <div style={{ marginTop: '0.35rem' }}>
              <Suspense fallback={<div className="map-placeholder" style={{ height: 240 }} />}>
                <LocationPicker
                  lat={form.locationLat}
                  lng={form.locationLng}
                  onChange={(lat, lng) =>
                    setForm((f) => ({ ...f, locationLat: lat, locationLng: lng }))
                  }
                />
              </Suspense>
              {form.locationLat && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() =>
                    setForm((f) => ({ ...f, locationLat: undefined, locationLng: undefined }))
                  }
                >
                  위치 초기화
                </button>
              )}
            </div>
          </div>

          <div className="form-label">
            Photos
            <div className="image-upload-area">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Add photos'}
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
                      aria-label="Remove photo"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

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
    </section>
  );
}
