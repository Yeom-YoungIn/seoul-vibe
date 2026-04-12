import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { ContentNotFoundError } from '../shared/errors/content.errors';
import { AdminContentService } from './admin.content.service';

const mockContentRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockTranslationRepository = () => ({
  create: jest.fn(),
});

const buildContent = (overrides: Partial<Content> = {}): Content =>
  ({
    id: 'content-uuid',
    slug: 'test-slug',
    isPublished: false,
    publishedAt: null,
    translations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Content);

const buildTranslation = (overrides: Partial<ContentTranslation> = {}): ContentTranslation =>
  ({
    id: 'trans-uuid',
    locale: 'KO',
    title: '테스트 제목',
    bodyHtml: null,
    bodyText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ContentTranslation);

describe('AdminContentService', () => {
  let service: AdminContentService;
  let contentRepo: jest.Mocked<Repository<Content>>;
  let translationRepo: jest.Mocked<Repository<ContentTranslation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminContentService,
        { provide: getRepositoryToken(Content), useFactory: mockContentRepository },
        { provide: getRepositoryToken(ContentTranslation), useFactory: mockTranslationRepository },
      ],
    }).compile();

    service = module.get(AdminContentService);
    contentRepo = module.get(getRepositoryToken(Content));
    translationRepo = module.get(getRepositoryToken(ContentTranslation));
  });

  describe('create', () => {
    it('새 콘텐츠와 번역을 생성한다', async () => {
      contentRepo.findOne.mockResolvedValue(null);
      const translation = buildTranslation();
      translationRepo.create.mockReturnValue(translation);
      const content = buildContent({ translations: [translation] });
      contentRepo.create.mockReturnValue(content);
      contentRepo.save.mockResolvedValue(content);

      const result = await service.create({
        slug: 'test-slug',
        translations: [{ locale: 'KO', title: '테스트 제목' }],
      });

      expect(contentRepo.save).toHaveBeenCalled();
      expect(result.slug).toBe('test-slug');
    });

    it('이미 존재하는 slug이면 ConflictException을 던진다', async () => {
      contentRepo.findOne.mockResolvedValue(buildContent());

      await expect(
        service.create({ slug: 'test-slug', translations: [{ locale: 'KO', title: '제목' }] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('콘텐츠 목록과 개수를 반환한다', async () => {
      const contents = [buildContent()];
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([contents, 1]),
      };
      contentRepo.createQueryBuilder.mockReturnValue(qb);

      const [list, count] = await service.findAll({ skip: 0, take: 20 });

      expect(list).toHaveLength(1);
      expect(count).toBe(1);
    });

    it('isPublished 필터를 적용한다', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      contentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ isPublished: true });

      expect(qb.andWhere).toHaveBeenCalledWith('content.isPublished = :isPublished', {
        isPublished: true,
      });
    });
  });

  describe('findOne', () => {
    it('존재하는 콘텐츠를 반환한다', async () => {
      const content = buildContent();
      contentRepo.findOne.mockResolvedValue(content);

      const result = await service.findOne('content-uuid');

      expect(result).toEqual(content);
    });

    it('존재하지 않으면 ContentNotFoundError를 던진다', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(ContentNotFoundError);
    });
  });

  describe('update', () => {
    it('slug와 번역을 수정한다', async () => {
      const translation = buildTranslation({ locale: 'KO' });
      const content = buildContent({ translations: [translation] });
      contentRepo.findOne
        .mockResolvedValueOnce(content)  // findOne inside update
        .mockResolvedValueOnce(null);    // slug 중복 체크
      contentRepo.save.mockResolvedValue({ ...content, slug: 'new-slug' });

      const result = await service.update('content-uuid', {
        slug: 'new-slug',
        translations: [{ locale: 'KO', title: '수정된 제목' }],
      });

      expect(contentRepo.save).toHaveBeenCalled();
      expect(result.slug).toBe('new-slug');
    });

    it('slug 중복 시 ConflictException을 던진다', async () => {
      const content = buildContent();
      contentRepo.findOne
        .mockResolvedValueOnce(content)
        .mockResolvedValueOnce(buildContent({ slug: 'existing-slug' }));

      await expect(
        service.update('content-uuid', { slug: 'existing-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('소프트 삭제를 수행한다', async () => {
      const content = buildContent();
      contentRepo.findOne.mockResolvedValue(content);
      contentRepo.softRemove.mockResolvedValue(content);

      await service.remove('content-uuid');

      expect(contentRepo.softRemove).toHaveBeenCalledWith(content);
    });
  });

  describe('publish', () => {
    it('미발행 콘텐츠를 발행한다', async () => {
      const content = buildContent({ isPublished: false });
      contentRepo.findOne.mockResolvedValue(content);
      contentRepo.save.mockResolvedValue({ ...content, isPublished: true });

      const result = await service.publish('content-uuid');

      expect(contentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: true }),
      );
    });

    it('이미 발행된 콘텐츠는 저장 없이 반환한다', async () => {
      const content = buildContent({ isPublished: true });
      contentRepo.findOne.mockResolvedValue(content);

      await service.publish('content-uuid');

      expect(contentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('unpublish', () => {
    it('발행된 콘텐츠를 발행 취소한다', async () => {
      const content = buildContent({ isPublished: true });
      contentRepo.findOne.mockResolvedValue(content);
      contentRepo.save.mockResolvedValue({ ...content, isPublished: false });

      await service.unpublish('content-uuid');

      expect(contentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: false }),
      );
    });

    it('이미 비발행 상태면 저장 없이 반환한다', async () => {
      const content = buildContent({ isPublished: false });
      contentRepo.findOne.mockResolvedValue(content);

      await service.unpublish('content-uuid');

      expect(contentRepo.save).not.toHaveBeenCalled();
    });
  });
});
