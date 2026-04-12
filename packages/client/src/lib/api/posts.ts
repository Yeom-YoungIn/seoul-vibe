import { api } from '../axios';

export type PostCategory = 'restaurant' | 'cafe' | 'etc';

export interface PostAuthor {
  id: string;
  nickname: string;
  profileImage: string | null;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  images: string[];
  category: PostCategory;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostFeedResponse {
  list: Post[];
  count: number;
}

export interface PostFeedParams {
  category?: PostCategory;
  skip?: number;
  take?: number;
}

export interface CreatePostPayload {
  content: string;
  images?: string[];
  category?: PostCategory;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface UpdatePostPayload {
  content?: string;
  images?: string[];
  category?: PostCategory;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
}

export const postsApi = {
  getFeed: (params: PostFeedParams = {}) =>
    api
      .get<{ data: PostFeedResponse }>('/posts', { params })
      .then((r) => r.data.data),

  getOne: (id: string) =>
    api
      .get<{ data: Post }>(`/posts/${id}`)
      .then((r) => r.data.data),

  create: (payload: CreatePostPayload) =>
    api
      .post<{ data: Post }>('/posts', payload)
      .then((r) => r.data.data),

  update: (id: string, payload: UpdatePostPayload) =>
    api
      .put<{ data: Post }>(`/posts/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string) =>
    api.delete(`/posts/${id}`),
};
