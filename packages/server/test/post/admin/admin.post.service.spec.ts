import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostCategory } from '../../../src/post/shared/entities/post.entity';
import { PostNotFoundError } from '../../../src/post/shared/errors/post.errors';
import { AdminPostService } from '../../../src/post/admin/admin.post.service';

const mockPostRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
});

const buildPost = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 'post-uuid',
    author: { id: 'user-uuid', nickname: 'tester' },
    content: '서울 힙플 추천',
    images: [],
    category: PostCategory.CAFE,
    locationName: null,
    locationLat: null,
    locationLng: null,
    likeCount: 0,
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as unknown as Post);

describe('AdminPostService', () => {
  let service: AdminPostService;
  let postRepo: jest.Mocked<Repository<Post>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminPostService, { provide: getRepositoryToken(Post), useFactory: mockPostRepository }],
    }).compile();

    service = module.get(AdminPostService);
    postRepo = module.get(getRepositoryToken(Post));
  });

  describe('findAll', () => {
    it('관리자 목록 조회에 기본 정렬과 relation 로딩을 적용한다', async () => {
      postRepo.findAndCount.mockResolvedValue([[buildPost()], 1]);

      const [list, count] = await service.findAll({ skip: 0, take: 20 });

      expect(list).toHaveLength(1);
      expect(count).toBe(1);
      expect(postRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          relations: ['author'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('숨김 여부와 카테고리 필터를 함께 적용한다', async () => {
      postRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isHidden: true, category: PostCategory.CAFE });

      expect(postRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isHidden: true, category: PostCategory.CAFE },
        }),
      );
    });
  });

  describe('hide / unhide / forceRemove', () => {
    it('게시글을 숨김 처리한다', async () => {
      const post = buildPost();
      postRepo.findOne.mockResolvedValue(post);
      postRepo.save.mockResolvedValue({ ...post, isHidden: true });

      const result = await service.hide('post-uuid');

      expect(result.isHidden).toBe(true);
    });

    it('게시글 숨김을 해제한다', async () => {
      const post = buildPost({ isHidden: true });
      postRepo.findOne.mockResolvedValue(post);
      postRepo.save.mockResolvedValue({ ...post, isHidden: false });

      const result = await service.unhide('post-uuid');

      expect(result.isHidden).toBe(false);
    });

    it('게시글을 강제 삭제한다', async () => {
      const post = buildPost();
      postRepo.findOne.mockResolvedValue(post);
      postRepo.softRemove.mockResolvedValue(post);

      await service.forceRemove('post-uuid');

      expect(postRepo.softRemove).toHaveBeenCalledWith(post);
    });

    it('존재하지 않는 게시글이면 PostNotFoundError를 던진다', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.hide('missing')).rejects.toThrow(PostNotFoundError);
    });
  });
});
