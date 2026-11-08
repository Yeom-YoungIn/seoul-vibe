import { api } from '../axios';
import { Article, ArticleSource } from './articles';
import { Post } from './posts';

const inflightRequests = new Map<string, Promise<unknown>>();

function serializeParams(params: Record<string, unknown>) {
  return JSON.stringify(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function withSingleFlight<T>(key: string, request: () => Promise<T>) {
  const existing = inflightRequests.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const nextRequest = request().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, nextRequest);

  return nextRequest;
}

// ── Types ──────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  nationality: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminUserListResponse {
  list: AdminUser[];
  count: number;
}

export interface AdminArticle extends Article {
  updatedAt: string;
}

export interface AdminArticleListResponse {
  list: AdminArticle[];
  count: number;
}

export interface AdminPostListResponse {
  list: AdminPost[];
  count: number;
}

export interface AdminPost extends Post {
  isHidden: boolean;
}

export type ArticleSourcePayload = Partial<Omit<ArticleSource, 'sourceType'>>;

export interface CreateArticlePayload extends ArticleSourcePayload {
  slug: string;
  translations: { locale: string; title: string; bodyHtml?: string; bodyText?: string }[];
}

export interface UpdateArticlePayload extends ArticleSourcePayload {
  slug?: string;
  translations?: { locale: string; title?: string; bodyHtml?: string; bodyText?: string }[];
}

// ── Users ──────────────────────────────────────

export const adminUsersApi = {
  getList: (params: { email?: string; skip?: number; take?: number } = {}) =>
    withSingleFlight(`users:${serializeParams(params)}`, () =>
      api
        .get<{ data: AdminUserListResponse }>('/users/admin', { params })
        .then((r) => r.data.data),
    ),

  changeRole: (id: string, role: UserRole) =>
    api.patch<{ data: AdminUser }>(`/users/admin/${id}/role`, { role }).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/users/admin/${id}`),
};

// ── Articles ───────────────────────────────────

export const adminArticlesApi = {
  getList: (params: { isPublished?: boolean; skip?: number; take?: number } = {}) =>
    withSingleFlight(`articles:${serializeParams(params)}`, () =>
      api
        .get<{ data: AdminArticleListResponse }>('/content/admin', { params })
        .then((r) => r.data.data),
    ),

  getOne: (id: string) =>
    api.get<{ data: AdminArticle }>(`/content/admin/${id}`).then((r) => r.data.data),

  create: (payload: CreateArticlePayload) =>
    api.post<{ data: AdminArticle }>('/content/admin', payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateArticlePayload) =>
    api.put<{ data: AdminArticle }>(`/content/admin/${id}`, payload).then((r) => r.data.data),

  publish: (id: string) =>
    api.patch<{ data: AdminArticle }>(`/content/admin/${id}/publish`).then((r) => r.data.data),

  unpublish: (id: string) =>
    api.patch<{ data: AdminArticle }>(`/content/admin/${id}/unpublish`).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/content/admin/${id}`),

  previewSource: (url: string) =>
    api
      .post<{ data: ArticleSource }>('/content/admin/source-preview', { url })
      .then((r) => r.data.data),
};

// ── Posts ──────────────────────────────────────

export const adminPostsApi = {
  getList: (params: { isHidden?: boolean; category?: string; skip?: number; take?: number } = {}) =>
    withSingleFlight(`posts:${serializeParams(params)}`, () =>
      api
        .get<{ data: AdminPostListResponse }>('/posts/admin', { params })
        .then((r) => r.data.data),
    ),

  hide: (id: string) =>
    api.patch<{ data: AdminPost }>(`/posts/admin/${id}/hide`).then((r) => r.data.data),

  unhide: (id: string) =>
    api.patch<{ data: AdminPost }>(`/posts/admin/${id}/unhide`).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/posts/admin/${id}`),
};
