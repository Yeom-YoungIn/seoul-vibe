import { api } from '../axios';

export interface ArticleTranslation {
  locale: string;
  title: string;
  bodyHtml: string | null;
  bodyText: string | null;
}

export type SourceType = 'INSTAGRAM' | 'LINK';

export interface ArticleSource {
  sourceUrl: string | null;
  sourceType: SourceType | null;
  sourceTitle: string | null;
  sourceDescription: string | null;
  sourceSiteName: string | null;
  sourceAuthor: string | null;
  sourceImagePath: string | null;
}

export interface Article extends ArticleSource {
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string | null;
  translations: ArticleTranslation[];
}

export interface ArticleListItem {
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  coverImageUrl: string | null;
  title: string;
}

export interface ArticleListResponse {
  list: ArticleListItem[];
  count: number;
}

export interface ArticleFetchParams {
  language?: 'KO' | 'EN';
  skip?: number;
  take?: number;
}

export const articlesApi = {
  getList: (params: ArticleFetchParams = {}) =>
    api
      .get<{ data: ArticleListResponse }>('/content', { params })
      .then((r) => r.data.data),

  getDetail: (slug: string, language: 'KO' | 'EN' = 'EN') =>
    api
      .get<{ data: Article }>(`/content/${slug}`, { params: { language } })
      .then((r) => r.data.data),
};
