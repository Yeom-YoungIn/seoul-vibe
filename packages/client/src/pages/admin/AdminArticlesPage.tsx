import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  adminArticlesApi,
  AdminArticle,
  CreateArticlePayload,
  UpdateArticlePayload,
} from '../../lib/api/admin';
import { getApiErrorMessage } from '../../lib/api/error';

const PAGE_SIZE = 20;
const LOCALES = ['EN', 'KO'] as const;

type FormMode = 'create' | 'edit';

interface ArticleFormState {
  slug: string;
  translations: { locale: string; title: string; bodyHtml: string }[];
}

const emptyForm = (): ArticleFormState => ({
  slug: '',
  translations: [{ locale: 'EN', title: '', bodyHtml: '' }],
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
    });
    setFormError('');
    setModal({ mode: 'edit', id: article.id });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal?.mode === 'create') {
        const payload: CreateArticlePayload = {
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
          ← Prev
        </button>
        <span className="pagination-info">
          {skip + 1}–{Math.min(skip + PAGE_SIZE, count)} of {count}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={skip + PAGE_SIZE >= count}
          onClick={() => setSkip((s) => s + PAGE_SIZE)}
        >
          Next →
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
                          ✕
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
                      placeholder="Body HTML"
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
