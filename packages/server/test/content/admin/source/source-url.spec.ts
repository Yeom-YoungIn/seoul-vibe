import { normalizeSourceUrl } from '../../../../src/content/admin/source/source-url';
import { InvalidSourceUrlError } from '../../../../src/content/shared/errors/content.errors';

describe('normalizeSourceUrl', () => {
  it.each([
    [
      'https://www.instagram.com/p/DcOEG9qkwW6/?img_index=2&psln=N2Z3',
      'https://www.instagram.com/p/DcOEG9qkwW6/',
      'INSTAGRAM',
      null,
    ],
    [
      'https://instagram.com/reel/AbC_12-x#x',
      'https://www.instagram.com/reel/AbC_12-x/',
      'INSTAGRAM',
      null,
    ],
    [
      'https://www.instagram.com/someuser/p/DcOEG9qkwW6/',
      'https://www.instagram.com/p/DcOEG9qkwW6/',
      'INSTAGRAM',
      null,
    ],
    [
      'https://blog.naver.com/cafe_lover/223456789012?trackingCode=x',
      'https://blog.naver.com/cafe_lover/223456789012',
      'LINK',
      'https://m.blog.naver.com/cafe_lover/223456789012',
    ],
    [
      'https://blog.naver.com/PostView.naver?blogId=cafe_lover&logNo=223456789012',
      'https://blog.naver.com/cafe_lover/223456789012',
      'LINK',
      'https://m.blog.naver.com/cafe_lover/223456789012',
    ],
    [
      'https://m.blog.naver.com/cafe_lover/223456789012',
      'https://blog.naver.com/cafe_lover/223456789012',
      'LINK',
      'https://m.blog.naver.com/cafe_lover/223456789012',
    ],
    [
      'https://foo.tistory.com/12?utm_source=ig&fbclid=1&page=2#c',
      'https://foo.tistory.com/12?page=2',
      'LINK',
      'https://foo.tistory.com/12?page=2',
    ],
  ])('%s 를 정규화한다', (raw, url, type, fetchUrl) => {
    expect(normalizeSourceUrl(raw)).toEqual({ url, type, fetchUrl });
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(normalizeSourceUrl('  https://foo.tistory.com/12  ').url).toBe(
      'https://foo.tistory.com/12'
    );
  });

  it.each([
    'ftp://a.com/x',
    'javascript:alert(1)',
    'not a url',
    '',
    'https://www.instagram.com/someuser/',
  ])('%s 는 InvalidSourceUrlError', (raw) => {
    expect(() => normalizeSourceUrl(raw)).toThrow(InvalidSourceUrlError);
  });
});
