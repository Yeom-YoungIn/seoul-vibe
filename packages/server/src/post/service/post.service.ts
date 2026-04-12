import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@app/common';
import { Post } from '../shared/entities/post.entity';
import { PostForbiddenError, PostNotFoundError } from '../shared/errors/post.errors';
import {
  CreatePostInput,
  GetPostFeedInput,
  PostServicePort,
  UpdatePostInput,
} from './post.service.port';

@Injectable()
export class PostService implements PostServicePort {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async getFeed(input: GetPostFeedInput): Promise<[Post[], number]> {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.isHidden = false')
      .orderBy('post.createdAt', 'DESC')
      .skip(input.skip ?? 0)
      .take(input.take ?? 20);

    if (input.category) {
      qb.andWhere('post.category = :category', { category: input.category });
    }

    return qb.getManyAndCount();
  }

  async getOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, isHidden: false },
      relations: ['author'],
    });
    if (!post) throw new PostNotFoundError();
    return post;
  }

  async create(input: CreatePostInput): Promise<Post> {
    const post = this.postRepository.create({
      author: { id: input.authorId },
      content: input.content,
      images: input.images ?? [],
      category: input.category,
      locationName: input.locationName,
      locationLat: input.locationLat,
      locationLng: input.locationLng,
    });
    const saved = await this.postRepository.save(post);
    return this.postRepository.findOne({ where: { id: saved.id }, relations: ['author'] }) as Promise<Post>;
  }

  async update(id: string, requesterId: string, input: UpdatePostInput): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new PostNotFoundError();
    if (post.author.id !== requesterId) throw new PostForbiddenError();

    Object.assign(post, {
      ...(input.content !== undefined && { content: input.content }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.locationName !== undefined && { locationName: input.locationName }),
      ...(input.locationLat !== undefined && { locationLat: input.locationLat }),
      ...(input.locationLng !== undefined && { locationLng: input.locationLng }),
    });

    return this.postRepository.save(post);
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new PostNotFoundError();
    if (post.author.id !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new PostForbiddenError();
    }
    await this.postRepository.softRemove(post);
  }
}
