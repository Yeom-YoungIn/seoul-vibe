import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SeoService } from '../../src/seo/seo.service';
import { Content } from '../../src/content/shared/entities/content.entity';
import { ContentTranslation } from '../../src/content/shared/entities/content-translations.entity';

const translation = (locale: string, title: string): ContentTranslation =>
  ({
    id: `${locale}-t`,
    locale,
    title,
    bodyHtml: `<p>${title} 본문</p>`,
    bodyText: null,
  }) as ContentTranslation;

const content = (overrides: Partial<Content> = {}): Content =>
  ({
    id: 'c1',
    slug: 'a',
    isPublished: true,
    publishedAt: new Date('2026-11-01T00:00:00Z'),
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-02T00:00:00Z'),
    deletedAt: null,
    sourceUrl: null,
    translations: [translation('KO', '한국어 제목'), translation('EN', 'English title')],
    ...overrides,
  }) as Content;

describe('SeoService', () => {
  let repo: { findOne: jest.Mock; find: jest.Mock };
  let service: SeoService;

  beforeEach(() => {
    repo = { findOne: jest.fn(), find: jest.fn() };
    const config = {
      get: (key: string) => ({ SITE_URL: 'https://sv.test/', SEO_INDEXABLE: 'true' })[key],
    } as unknown as ConfigService;
    service = new SeoService(repo as unknown as Repository<Content>, config);
  });

  it('아티클 상세 head는 발행된 콘텐츠의 해당 언어 번역으로 렌더링한다', async () => {
    repo.findOne.mockResolvedValue(content());

    const head = await service.head('/ko/articles/a');

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: 'a', isPublished: true }),
        relations: { translations: true },
      })
    );
    expect(head).toContain('<title>한국어 제목 | Seoul Vibe</title>');
    expect(head).toContain('hreflang="en"');
    expect(head).toContain('<link rel="canonical" href="https://sv.test/ko/articles/a">');
  });

  it('해당 언어 번역이 없으면 기본 head에 noindex를 넣는다', async () => {
    repo.findOne.mockResolvedValue(content({ translations: [translation('EN', 'English title')] }));

    const head = await service.head('/ko/articles/a');

    expect(head).toContain('noindex');
    expect(head).not.toContain('canonical');
  });

  it('콘텐츠가 없으면 기본 head에 noindex를 넣는다', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.head('/en/articles/missing')).toContain('noindex');
  });

  it('목록 body는 해당 언어의 최신 발행 아티클 링크를 렌더링한다', async () => {
    repo.find.mockResolvedValue([content()]);

    const body = await service.body('/ko/articles');

    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
    expect(body).toContain('<a href="/ko/articles/a">한국어 제목</a>');
  });

  it('그 외 경로 body는 비어 있다', async () => {
    expect(await service.body('/en/feed')).toBe('');
  });

  it('sitemap은 홈·목록과 아티클별 존재하는 번역 URL을 포함한다', async () => {
    repo.find.mockResolvedValue([
      content(),
      content({ slug: 'ko-only', translations: [translation('KO', '전용')] }),
    ]);

    const xml = await service.sitemap();

    for (const path of [
      '/en',
      '/ko',
      '/en/articles',
      '/ko/articles',
      '/en/articles/a',
      '/ko/articles/a',
      '/ko/articles/ko-only',
    ]) {
      expect(xml).toContain(`<loc>https://sv.test${path}</loc>`);
    }
    expect(xml).not.toContain('<loc>https://sv.test/en/articles/ko-only</loc>');
  });
});
