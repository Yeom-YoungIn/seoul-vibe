import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@app/common';
import { Post, PostCategory } from '../../../src/post/shared/entities/post.entity';
import { PostForbiddenError, PostNotFoundError } from '../../../src/post/shared/errors/post.errors';
import { PostService } from '../../../src/post/service/post.service';

const mockPostRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  findAndCount: jest.fn(),
});

const buildPost = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 'post-uuid',
    author: { id: 'user-uuid', nickname: 'tester' },
    content: '서울 힙플 추천',
    images: [],
    category: PostCategory.CAFE,
    locationName: '성수동 카페',
    locationLat: 37.5443,
    locationLng: 127.0557,
    likeCount: 0,
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as unknown as Post);

describe('PostService', () => {
  let service: PostService;
  let postRepo: jest.Mocked<Repository<Post>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService, { provide: getRepositoryToken(Post), useFactory: mockPostRepository }],
    }).compile();

    service = module.get(PostService);
    postRepo = module.get(getRepositoryToken(Post));
  });

  describe('getFeed', () => {
    it('숨김 처리되지 않은 게시글 목록을 반환한다', async () => {
      postRepo.findAndCount.mockResolvedValue([[buildPost()], 1]);

      const [list, count] = await service.getFeed({ skip: 0, take: 20 });

      expect(list).toHaveLength(1);
      expect(count).toBe(1);
      expect(postRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isHidden: false },
          relations: ['author'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('카테고리 필터를 적용한다', async () => {
      postRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getFeed({ category: PostCategory.CAFE });

      expect(postRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isHidden: false, category: PostCategory.CAFE },
        }),
      );
    });
  });

  describe('getOne', () => {
    it('존재하는 게시글을 반환한다', async () => {
      const post = buildPost();
      postRepo.findOne.mockResolvedValue(post);

      const result = await service.getOne('post-uuid');

      expect(result).toEqual(post);
    });

    it('존재하지 않으면 PostNotFoundError를 던진다', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.getOne('bad-id')).rejects.toThrow(PostNotFoundError);
    });
  });

  describe('create', () => {
    it('새 게시글을 생성하고 author와 함께 반환한다', async () => {
      const post = buildPost();
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);
      postRepo.findOne.mockResolvedValue(post);

      const result = await service.create({
        authorId: 'user-uuid',
        content: '서울 힙플 추천',
        images: [],
        category: PostCategory.CAFE,
      });

      expect(postRepo.save).toHaveBeenCalled();
      expect(result).toEqual(post);
    });
  });

  describe('update', () => {
    it('본인의 게시글을 수정한다', async () => {
      const post = buildPost();
      postRepo.findOne.mockResolvedValue(post);
      postRepo.save.mockResolvedValue({ ...post, content: '수정된 내용' });

      const result = await service.update('post-uuid', 'user-uuid', { content: '수정된 내용' });

      expect(postRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('수정된 내용');
    });

    it('다른 유저의 게시글 수정 시 PostForbiddenError를 던진다', async () => {
      const post = buildPost({ author: { id: 'other-uuid' } as any });
      postRepo.findOne.mockResolvedValue(post);

      await expect(service.update('post-uuid', 'user-uuid', { content: '수정' })).rejects.toThrow(
        PostForbiddenError,
      );
    });

    it('존재하지 않는 게시글 수정 시 PostNotFoundError를 던진다', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', 'user-uuid', { content: '수정' })).rejects.toThrow(
        PostNotFoundError,
      );
    });
  });

  describe('remove', () => {
    it('본인은 자신의 게시글을 삭제할 수 있다', async () => {
      const post = buildPost();
      postRepo.findOne.mockResolvedValue(post);
      postRepo.softRemove.mockResolvedValue(post);

      await service.remove('post-uuid', 'user-uuid', UserRole.USER);

      expect(postRepo.softRemove).toHaveBeenCalledWith(post);
    });

    it('관리자는 타인의 게시글도 삭제할 수 있다', async () => {
      const post = buildPost({ author: { id: 'other-uuid' } as any });
      postRepo.findOne.mockResolvedValue(post);
      postRepo.softRemove.mockResolvedValue(post);

      await service.remove('post-uuid', 'admin-uuid', UserRole.ADMIN);

      expect(postRepo.softRemove).toHaveBeenCalled();
    });

    it('타인의 게시글 삭제 시 PostForbiddenError를 던진다', async () => {
      const post = buildPost({ author: { id: 'other-uuid' } as any });
      postRepo.findOne.mockResolvedValue(post);

      await expect(service.remove('post-uuid', 'user-uuid', UserRole.USER)).rejects.toThrow(
        PostForbiddenError,
      );
    });

    it('존재하지 않는 게시글 삭제 시 PostNotFoundError를 던진다', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id', 'user-uuid', UserRole.USER)).rejects.toThrow(
        PostNotFoundError,
      );
    });
  });
});
