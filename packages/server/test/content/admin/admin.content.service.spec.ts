import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../../../src/content/shared/entities/content.entity';
import { ContentTranslation } from '../../../src/content/shared/entities/content-translations.entity';
import {
  ContentNotFoundError,
  InvalidSourceUrlError,
} from '../../../src/content/shared/errors/content.errors';
import { AdminContentService } from '../../../src/content/admin/admin.content.service';
import { COVER_IMAGE_URL } from '../../../src/content/admin/dto/request/create-content.dto';

const mockContentRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  findAndCount: jest.fn(),
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

    it('본문 HTML의 스크립트와 이벤트 속성을 제거하고 저장한다', async () => {
      contentRepo.findOne.mockResolvedValue(null);
      contentRepo.create.mockReturnValue(buildContent());
      contentRepo.save.mockImplementation(async (c) => c as Content);

      await service.create({
        slug: 'test-slug',
        translations: [
          { locale: 'KO', title: 't', bodyHtml: '<p onclick="x()">hi</p><script>alert(1)</script>' },
        ],
      });

      expect(translationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ bodyHtml: '<p>hi</p>' }),
      );
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
      contentRepo.findAndCount.mockResolvedValue([[buildContent()], 1]);

      const [list, count] = await service.findAll({ skip: 0, take: 20 });

      expect(list).toHaveLength(1);
      expect(count).toBe(1);
      expect(contentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['translations'],
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('isPublished 필터를 적용한다', async () => {
      contentRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isPublished: true });

      expect(contentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
        }),
      );
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
      contentRepo.findOne.mockResolvedValueOnce(content).mockResolvedValueOnce(null);
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

      await expect(service.update('content-uuid', { slug: 'existing-slug' })).rejects.toThrow(
        ConflictException,
      );
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

      await service.publish('content-uuid');

      expect(contentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isPublished: true }));
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

      expect(contentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isPublished: false }));
    });

    it('이미 비발행 상태면 저장 없이 반환한다', async () => {
      const content = buildContent({ isPublished: false });
      contentRepo.findOne.mockResolvedValue(content);

      await service.unpublish('content-uuid');

      expect(contentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('source', () => {
    const sourceFields = {
      sourceUrl: 'https://blog.naver.com/a/1',
      sourceType: 'LINK',
      sourceTitle: '원문 제목',
      sourceDescription: '원문 설명',
      sourceSiteName: '네이버 블로그',
      sourceAuthor: '작성자',
      sourceImagePath: '/uploads/sources/x.jpg',
    } as const;

    beforeEach(() => {
      contentRepo.create.mockImplementation((input) => ({ ...(input as object), translations: [] }) as unknown as Content);
      contentRepo.save.mockImplementation(async (content) => content as Content);
      translationRepo.create.mockImplementation((input) => input as ContentTranslation);
    });

    it('create 시 sourceUrl을 정규화하고 sourceType을 설정한다', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await service.create({
        slug: 'insta',
        translations: [{ locale: 'KO', title: '제목' }],
        sourceUrl: 'https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2',
        sourceAuthor: '@seoul',
      });

      const saved = contentRepo.save.mock.calls[0][0] as Content;
      expect(saved.sourceUrl).toBe('https://www.instagram.com/p/DcOEG9qkwW6/');
      expect(saved.sourceType).toBe('INSTAGRAM');
      expect(saved.sourceAuthor).toBe('@seoul');
    });

    it('create 시 sourceUrl이 없으면 source 필드를 비워둔다', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await service.create({ slug: 'plain', translations: [{ locale: 'KO', title: '제목' }] });

      const saved = contentRepo.save.mock.calls[0][0] as Content;
      expect(saved.sourceUrl ?? null).toBeNull();
      expect(saved.sourceType ?? null).toBeNull();
    });

    it('update 시 sourceUrl이 null이면 모든 source 필드를 비운다', async () => {
      contentRepo.findOne.mockResolvedValue(buildContent({ ...sourceFields }));

      const result = await service.update('content-uuid', { sourceUrl: null });

      expect(result.sourceUrl).toBeNull();
      expect(result.sourceType).toBeNull();
      expect(result.sourceTitle).toBeNull();
      expect(result.sourceDescription).toBeNull();
      expect(result.sourceSiteName).toBeNull();
      expect(result.sourceAuthor).toBeNull();
      expect(result.sourceImagePath).toBeNull();
    });

    it('update 시 sourceUrl이 없으면 기존 source 필드를 유지한다', async () => {
      contentRepo.findOne.mockResolvedValue(buildContent({ ...sourceFields }));

      const result = await service.update('content-uuid', { sourceTitle: '바뀐 제목' });

      expect(result.sourceUrl).toBe(sourceFields.sourceUrl);
      expect(result.sourceType).toBe('LINK');
      expect(result.sourceTitle).toBe('바뀐 제목');
      expect(result.sourceImagePath).toBe(sourceFields.sourceImagePath);
    });

    it('update 시 sourceUrl만 바뀌면 sourceType을 다시 계산한다', async () => {
      contentRepo.findOne.mockResolvedValue(buildContent({ ...sourceFields }));

      const result = await service.update('content-uuid', {
        sourceUrl: 'https://instagram.com/reel/AbC/',
      });

      expect(result.sourceUrl).toBe('https://www.instagram.com/reel/AbC/');
      expect(result.sourceType).toBe('INSTAGRAM');
    });

    it('잘못된 sourceUrl이면 InvalidSourceUrlError', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          slug: 'bad',
          translations: [{ locale: 'KO', title: '제목' }],
          sourceUrl: 'javascript:alert(1)',
        }),
      ).rejects.toBeInstanceOf(InvalidSourceUrlError);
    });
  });

  describe('coverImageUrl', () => {
    it('create 시 대표 이미지를 저장하고 빈 값은 null로 둔다', async () => {
      contentRepo.findOne.mockResolvedValue(null);
      contentRepo.create.mockImplementation((v) => v as Content);
      contentRepo.save.mockImplementation(async (v) => v as Content);

      await service.create({ slug: 'a', translations: [], coverImageUrl: ' https://x/a.jpg ' });
      await service.create({ slug: 'b', translations: [], coverImageUrl: '' });

      expect(contentRepo.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ coverImageUrl: 'https://x/a.jpg' })
      );
      expect(contentRepo.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ coverImageUrl: null })
      );
    });

    it('update 시 값이 없으면 유지하고 null이면 제거한다', async () => {
      const content = buildContent({ coverImageUrl: '/uploads/a.jpg' });
      contentRepo.findOne.mockResolvedValue(content);
      contentRepo.save.mockImplementation(async (v) => v as Content);

      await service.update('content-uuid', {});
      expect(content.coverImageUrl).toBe('/uploads/a.jpg');
      await service.update('content-uuid', { coverImageUrl: null });
      expect(content.coverImageUrl).toBeNull();
    });

    it('http(s) URL과 업로드 경로만 허용한다', () => {
      for (const ok of [
        '',
        'https://upload.wikimedia.org/a.jpg',
        'http://x/a.png',
        '/uploads/a.jpg',
      ])
        expect(COVER_IMAGE_URL.test(ok)).toBe(true);
      for (const bad of [
        'javascript:alert(1)',
        'data:image/png;base64,xx',
        '//evil.com/a.jpg',
        'a.jpg',
      ])
        expect(COVER_IMAGE_URL.test(bad)).toBe(false);
    });
  });
});
