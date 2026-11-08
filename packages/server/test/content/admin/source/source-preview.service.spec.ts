import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';
import { SourcePreviewService } from '../../../../src/content/admin/source/source-preview.service';
import { safeFetch, SourceFetchFailedError } from '../../../../src/content/admin/source/safe-fetch';
import { BlockedSourceHostError } from '../../../../src/content/shared/errors/content.errors';

jest.mock('../../../../src/content/admin/source/safe-fetch', () => {
  const actual = jest.requireActual('../../../../src/content/admin/source/safe-fetch');
  return { ...actual, safeFetch: jest.fn() };
});

const mockedSafeFetch = safeFetch as jest.MockedFunction<typeof safeFetch>;

const html = `<meta property="og:title" content="성수 카페">
<meta property="og:description" content="좋은 곳">
<meta property="og:site_name" content="네이버 블로그">
<meta property="og:image" content="https://img.test/a.jpg">`;

describe('SourcePreviewService', () => {
  let service: SourcePreviewService;
  let writeFile: jest.SpyInstance;

  beforeEach(() => {
    mockedSafeFetch.mockReset();
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    writeFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    service = new SourcePreviewService({ get: () => undefined } as unknown as ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('인스타그램 URL은 외부 요청 없이 정규화 결과를 반환한다', async () => {
    const result = await service.preview('https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2');

    expect(mockedSafeFetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      sourceUrl: 'https://www.instagram.com/p/DcOEG9qkwW6/',
      sourceType: 'INSTAGRAM',
      sourceTitle: null,
      sourceDescription: null,
      sourceSiteName: 'Instagram',
      sourceAuthor: null,
      sourceImagePath: null,
    });
  });

  it('블로그 URL은 메타를 수집하고 썸네일을 저장한다', async () => {
    mockedSafeFetch
      .mockResolvedValueOnce({
        finalUrl: 'https://m.blog.naver.com/a/1',
        contentType: 'text/html',
        body: Buffer.from(html),
      })
      .mockResolvedValueOnce({
        finalUrl: 'https://img.test/a.jpg',
        contentType: 'image/jpeg',
        body: Buffer.from('img'),
      });

    const result = await service.preview('https://blog.naver.com/a/1');

    expect(mockedSafeFetch).toHaveBeenNthCalledWith(
      1,
      'https://m.blog.naver.com/a/1',
      expect.objectContaining({ maxBytes: 2 * 1024 * 1024 }),
    );
    expect(mockedSafeFetch).toHaveBeenNthCalledWith(
      2,
      'https://img.test/a.jpg',
      expect.objectContaining({ maxBytes: 5 * 1024 * 1024 }),
    );
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      sourceUrl: 'https://blog.naver.com/a/1',
      sourceType: 'LINK',
      sourceTitle: '성수 카페',
      sourceDescription: '좋은 곳',
      sourceSiteName: '네이버 블로그',
      sourceAuthor: null,
    });
    expect(result.sourceImagePath).toMatch(/^\/uploads\/sources\/[0-9a-f-]+\.jpg$/);
  });

  it('HTML 수집이 실패해도 정규화 결과를 반환한다', async () => {
    mockedSafeFetch.mockRejectedValueOnce(new SourceFetchFailedError('timeout'));

    const result = await service.preview('https://foo.tistory.com/12?utm_source=x');

    expect(result).toEqual({
      sourceUrl: 'https://foo.tistory.com/12',
      sourceType: 'LINK',
      sourceTitle: null,
      sourceDescription: null,
      sourceSiteName: null,
      sourceAuthor: null,
      sourceImagePath: null,
    });
  });

  it('이미지가 아닌 응답은 썸네일로 저장하지 않는다', async () => {
    mockedSafeFetch
      .mockResolvedValueOnce({ finalUrl: 'https://blog.test/1', contentType: 'text/html', body: Buffer.from(html) })
      .mockResolvedValueOnce({ finalUrl: 'https://img.test/a.jpg', contentType: 'text/html', body: Buffer.from('x') });

    const result = await service.preview('https://blog.test/1');

    expect(result.sourceImagePath).toBeNull();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('썸네일 수집이 실패해도 나머지 메타는 반환한다', async () => {
    mockedSafeFetch
      .mockResolvedValueOnce({ finalUrl: 'https://blog.test/1', contentType: 'text/html', body: Buffer.from(html) })
      .mockRejectedValueOnce(new SourceFetchFailedError('too large'));

    const result = await service.preview('https://blog.test/1');

    expect(result.sourceTitle).toBe('성수 카페');
    expect(result.sourceImagePath).toBeNull();
  });

  it('차단된 호스트 에러는 그대로 전파한다', async () => {
    mockedSafeFetch.mockRejectedValueOnce(new BlockedSourceHostError());

    await expect(service.preview('http://localhost:3000/')).rejects.toBeInstanceOf(BlockedSourceHostError);
  });
});
