import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ContentServicePort } from '../../../src/content/service/content.service.port';
import { ServiceContentService } from '../../../src/content/service/content.service';
import { Content } from '../../../src/content/shared/entities/content.entity';
import { ContentTranslation } from '../../../src/content/shared/entities/content-translations.entity';
import { ContentNotFoundError } from '../../../src/content/shared/errors/content.errors';

const mockContentRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
});

const buildContent = (overrides: Partial<Content> = {}): Content =>
  ({
    id: 'content-uuid',
    slug: 'test-slug',
    isPublished: true,
    publishedAt: new Date(),
    translations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Content);

const buildTranslation = (overrides: Partial<ContentTranslation> = {}): ContentTranslation =>
  ({
    id: 'translation-uuid',
    locale: 'KO',
    title: '제목',
    bodyHtml: '<p>본문</p>',
    bodyText: '본문',
    content: buildContent(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ContentTranslation);

describe('ServiceContentService', () => {
  let service: ContentServicePort;
  let contentRepo: jest.Mocked<Repository<Content>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceContentService,
        { provide: getRepositoryToken(Content), useFactory: mockContentRepository },
      ],
    }).compile();

    service = module.get(ServiceContentService);
    contentRepo = module.get(getRepositoryToken(Content));
  });

  describe('getContentsList', () => {
    it('요청 locale에 맞는 번역만 포함한 콘텐츠 목록을 반환한다', async () => {
      const translation = buildTranslation();
      const extraTranslation = buildTranslation({ locale: 'EN', title: 'Title' });
      contentRepo.findAndCount.mockResolvedValue([
        [buildContent({ translations: [translation, extraTranslation] })],
        1,
      ]);

      const [list, count] = await service.getContentsList({ language: 'KO', skip: 0, take: 10 });

      expect(count).toBe(1);
      expect(list[0].translations).toEqual([translation]);
      expect((list[0] as any).title).toBe('제목');
      expect(contentRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          deletedAt: IsNull(),
          translations: {
            locale: 'KO',
          },
        },
        relations: {
          translations: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getContentDetail', () => {
    it('slug와 locale에 맞는 콘텐츠 상세를 반환한다', async () => {
      const translation = buildTranslation();
      const extraTranslation = buildTranslation({ locale: 'EN', title: 'Title' });
      contentRepo.findOne.mockResolvedValue(buildContent({ translations: [translation, extraTranslation] }));

      const result = await service.getContentDetail({ slug: 'test-slug', language: 'KO' });

      expect(result.slug).toBe('test-slug');
      expect(result.translations).toEqual([translation]);
    });

    it('비공개 또는 다른 locale만 있으면 조회되지 않는다', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.getContentDetail({ slug: 'missing', language: 'KO' })).rejects.toThrow(
        ContentNotFoundError,
      );
    });

    it('해당 locale 번역이 없으면 ContentNotFoundError를 던진다', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.getContentDetail({ slug: 'missing', language: 'KO' })).rejects.toThrow(
        ContentNotFoundError,
      );
    });
  });
});
