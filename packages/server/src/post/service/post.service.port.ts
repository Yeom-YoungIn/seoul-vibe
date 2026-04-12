import { Post, PostCategory } from '../shared/entities/post.entity';

export interface GetPostFeedInput {
  category?: PostCategory;
  skip?: number;
  take?: number;
}

export interface CreatePostInput {
  authorId: string;
  content: string;
  images?: string[];
  category?: PostCategory;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface UpdatePostInput {
  content?: string;
  images?: string[];
  category?: PostCategory;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
}

export abstract class PostServicePort {
  abstract getFeed(input: GetPostFeedInput): Promise<[Post[], number]>;
  abstract getOne(id: string): Promise<Post>;
  abstract create(input: CreatePostInput): Promise<Post>;
  abstract update(id: string, requesterId: string, input: UpdatePostInput): Promise<Post>;
  abstract remove(id: string, requesterId: string, requesterRole: string): Promise<void>;
}
