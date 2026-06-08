import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../shared/entities/post.entity';
import { PostNotFoundError } from '../shared/errors/post.errors';
import { ListAdminPostDto } from './dto/request/list-admin-post.dto';

@Injectable()
export class AdminPostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAll(dto: ListAdminPostDto): Promise<[Post[], number]> {
    return this.postRepository.findAndCount({
      where: {
        ...(dto.isHidden !== undefined ? { isHidden: dto.isHidden } : {}),
        ...(dto.category ? { category: dto.category } : {}),
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: dto.skip ?? 0,
      take: dto.take ?? 20,
    });
  }

  async hide(id: string): Promise<Post> {
    const post = await this.findOne(id);
    if (post.isHidden) return post;
    post.isHidden = true;
    return this.postRepository.save(post);
  }

  async unhide(id: string): Promise<Post> {
    const post = await this.findOne(id);
    if (!post.isHidden) return post;
    post.isHidden = false;
    return this.postRepository.save(post);
  }

  async forceRemove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.softRemove(post);
  }

  private async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new PostNotFoundError();
    return post;
  }
}
