import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  adminArticlesApi,
  AdminArticle,
  CreateArticlePayload,
  UpdateArticlePayload,
} from '../../lib/api/admin';
import { ArticleSource } from '../../lib/api/articles';
import { getApiErrorMessage } from '../../lib/api/error';
import { assetUrl } from '../../lib/axios';

const PAGE_SIZE = 20;
const LOCALES = ['EN', 'KO'] as const;

type FormMode = 'create' | 'edit';

type SourceForm = { [K in keyof ArticleSource]: string };

interface ArticleFormState {
  slug: string;
  translations: { locale: string; title: string; bodyHtml: string }[];
  source: SourceForm;
}

const emptySource = (): SourceForm => ({
  sourceUrl: '',
  sourceType: '',
  sourceTitle: '',
  sourceDescription: '',
  sourceSiteName: '',
  sourceAuthor: '',
  sourceImagePath: '',
});

const toSourceForm = (source: Partial<ArticleSource>): SourceForm => {
  const form = emptySource();
  for (const key of Object.keys(form) as (keyof SourceForm)[]) form[key] = source[key] ?? '';
  return form;
};

/** 빈 URL이면 출처 제거(null), 나머지 빈 값도 null로 보낸다 */
const toSourcePayload = (source: SourceForm) => {
  if (!source.sourceUrl.trim()) return { sourceUrl: null };
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== 'sourceType')
      .map(([key, value]) => [key, value.trim() ? value.trim() : null])
  );
};

const BODY_PLACEHOLDER =
  '원문을 복사하지 말고, 직접 쓴 추천 이유·위치·팁을 3~6문장으로 적어주세요.';

const emptyForm = (): ArticleFormState => ({
  slug: '',
  translations: [{ locale: 'EN', title: '', bodyHtml: '' }],
  source: emptySource(),
});

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{ mode: FormMode; id?: string } | null>(null);
  const [form, setForm] = useState<ArticleFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminArticlesApi
      .getList({ isPublished, skip, take: PAGE_SIZE })
      .then((res) => {
        setArticles(res.list);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  }, [isPublished, skip]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError('');
    setPreviewError('');
    setModal({ mode: 'create' });
  };

  const openEdit = async (article: AdminArticle) => {
    const detail = await adminArticlesApi.getOne(article.id);
    setForm({
      slug: detail.slug,
      translations: (detail.translations ?? []).map((t) => ({
        locale: t.locale,
        title: t.title,
        bodyHtml: t.bodyHtml ?? '',
      })),
      source: toSourceForm(detail),
    });
    setFormError('');
    setPreviewError('');
    setModal({ mode: 'edit', id: article.id });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal?.mode === 'create') {
        const payload: CreateArticlePayload = {
          ...toSourcePayload(form.source),
          slug: form.slug,
          translations: form.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            bodyHtml: t.bodyHtml,
          })),
        };
        await adminArticlesApi.create(payload);
      } else if (modal?.id) {
        const payload: UpdateArticlePayload = {
          ...toSourcePayload(form.source),
          slug: form.slug,
          translations: form.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            bodyHtml: t.bodyHtml,
          })),
        };
        await adminArticlesApi.update(modal.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (article: AdminArticle) => {
    const updated = article.isPublished
      ? await adminArticlesApi.unpublish(article.id)
      : await adminArticlesApi.publish(article.id);
    setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await adminArticlesApi.remove(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setCount((c) => c - 1);
  };

  const setTranslation = (idx: number, field: string, value: string) => {
    setForm((f) => {
      const ts = [...f.translations];
      ts[idx] = { ...ts[idx], [field]: value };
      return { ...f, translations: ts };
    });
  };

  const setSource = (field: keyof SourceForm, value: string) => {
    setForm((f) => ({ ...f, source: { ...f.source, [field]: value } }));
  };

  const handlePreviewSource = async () => {
    if (!form.source.sourceUrl.trim()) return;
    setPreviewing(true);
    setPreviewError('');
    try {
      const preview = await adminArticlesApi.previewSource(form.source.sourceUrl.trim());
      // 관리자가 이미 입력한 작성자는 덮어쓰지 않는다
      setForm((f) => ({
        ...f,
        source: {
          ...toSourceForm(preview),
          sourceAuthor: f.source.sourceAuthor.trim() ? f.source.sourceAuthor : (preview.sourceAuthor ?? ''),
        },
      }));
    } catch (err) {
      setPreviewError(getApiErrorMessage(err, 'Failed to load the source.'));
    } finally {
      setPreviewing(false);
    }
  };

  const addTranslation = () => {
    setForm((f) => ({
      ...f,
      translations: [...f.translations, { locale: 'KO', title: '', bodyHtml: '' }],
    }));
  };

  const removeTranslation = (idx: number) => {
    setForm((f) => ({ ...f, translations: f.translations.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          Articles <span className="admin-count">{count}</span>
        </h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + New article
        </button>
      </div>

      <div className="admin-filter-row">
        {[
          { label: 'All', val: undefined },
          { label: 'Published', val: true },
          { label: 'Draft', val: false },
        ].map((f) => (
          <button
            key={String(f.val)}
            className={`filter-chip ${isPublished === f.val ? 'active' : ''}`}
            onClick={() => {
              setIsPublished(f.val);
              setSkip(0);
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
                <th>Slug</th>
                <th>Status</th>
                <th>Published at</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="td-slug">{a.slug}</td>
                  <td>
                    <span className={`status-badge ${a.isPublished ? 'published' : 'draft'}`}>
                      {a.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm ${a.isPublished ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => handlePublishToggle(a)}
                    >
                      {a.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(a.id)}>
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
        <button
          className="btn btn-ghost btn-sm"
          disabled={skip === 0}
          onClick={() => setSkip((s) => s - PAGE_SIZE)}
        >
          Prev
        </button>
        <span className="pagination-info">
          {skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={skip + PAGE_SIZE >= count}
          onClick={() => setSkip((s) => s + PAGE_SIZE)}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {modal.mode === 'create' ? 'New article' : 'Edit article'}
            </h2>
            <form onSubmit={handleSave} className="modal-form">
              <label className="form-label">
                Slug
                <input
                  className="form-input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="my-article-slug"
                  required
                />
              </label>

              <fieldset className="source-fieldset">
                <legend className="form-label">Original source (optional)</legend>
                <div className="source-url-row">
                  <input
                    className="form-input"
                    type="url"
                    value={form.source.sourceUrl}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        // URL을 직접 바꾸면 이전 미리보기 결과(유형·제목·설명·사이트·썸네일)는 더 이상 유효하지 않다.
                        // 관리자가 직접 쓴 작성자만 남긴다.
                        source: {
                          ...emptySource(),
                          sourceUrl: e.target.value,
                          sourceAuthor: f.source.sourceAuthor,
                        },
                      }))
                    }
                    placeholder="https://www.instagram.com/p/… or blog post URL"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handlePreviewSource}
                    disabled={previewing || !form.source.sourceUrl.trim()}
                  >
                    {previewing ? 'Loading…' : 'Fetch'}
                  </button>
                </div>
                {previewError && <p className="auth-error">{previewError}</p>}

                {form.source.sourceUrl.trim() && (
                  <>
                    {form.source.sourceType === 'INSTAGRAM' ? (
                      <p className="source-hint">
                        인스타그램 공식 임베드로 표시됩니다. 작성자 핸들(@...)을 입력하세요.
                      </p>
                    ) : (
                      <>
                        {form.source.sourceImagePath && (
                          <div className="source-thumb">
                            <img src={assetUrl(form.source.sourceImagePath)} alt="" />
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setSource('sourceImagePath', '')}
                            >
                              Remove image
                            </button>
                          </div>
                        )}
                        <input
                          className="form-input"
                          placeholder="Source title"
                          value={form.source.sourceTitle}
                          onChange={(e) => setSource('sourceTitle', e.target.value)}
                          maxLength={300}
                        />
                        <input
                          className="form-input"
                          placeholder="Source description"
                          value={form.source.sourceDescription}
                          onChange={(e) => setSource('sourceDescription', e.target.value)}
                          maxLength={500}
                        />
                      </>
                    )}
                    <div className="source-meta-row">
                      <input
                        className={`form-input${form.source.sourceType === 'INSTAGRAM' ? ' is-emphasis' : ''}`}
                        placeholder="Author (@handle)"
                        value={form.source.sourceAuthor}
                        onChange={(e) => setSource('sourceAuthor', e.target.value)}
                        maxLength={100}
                      />
                      <input
                        className="form-input"
                        placeholder="Site name"
                        value={form.source.sourceSiteName}
                        onChange={(e) => setSource('sourceSiteName', e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm source-clear"
                      onClick={() => setForm((f) => ({ ...f, source: emptySource() }))}
                    >
                      Remove source
                    </button>
                  </>
                )}
              </fieldset>

              <div className="modal-translations">
                {form.translations.map((t, i) => (
                  <div key={i} className="translation-block">
                    <div className="translation-header">
                      <select
                        className="form-select"
                        value={t.locale}
                        onChange={(e) => setTranslation(i, 'locale', e.target.value)}
                      >
                        {LOCALES.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      {form.translations.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeTranslation(i)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      className="form-input"
                      placeholder="Title"
                      value={t.title}
                      onChange={(e) => setTranslation(i, 'title', e.target.value)}
                      required
                    />
                    <textarea
                      className="form-textarea"
                      placeholder={BODY_PLACEHOLDER}
                      value={t.bodyHtml}
                      onChange={(e) => setTranslation(i, 'bodyHtml', e.target.value)}
                      rows={8}
                    />
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addTranslation}>
                  + Add translation
                </button>
              </div>

              {formError && <p className="auth-error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
