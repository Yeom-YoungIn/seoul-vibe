import { parseSeoPath, toLanguage, toUrlLang } from '../../src/seo/seo-path';

describe('parseSeoPath', () => {
  it.each([
    ['/en', { kind: 'home', lang: 'en' }],
    ['/ko/', { kind: 'home', lang: 'ko' }],
    ['/en/articles', { kind: 'articles', lang: 'en' }],
    ['/ko/articles/hidden-cafe?x=1', { kind: 'article', lang: 'ko', slug: 'hidden-cafe' }],
    ['/ko/articles/%EC%B9%B4%ED%8E%98', { kind: 'article', lang: 'ko', slug: '카페' }],
    ['/jp/articles/a', { kind: 'other' }],
    ['/admin', { kind: 'other' }],
    ['/en/feed', { kind: 'other' }],
    ['/', { kind: 'other' }],
    ['/en/articles/%E0%A4%A', { kind: 'other' }],
  ])('%s 를 해석한다', (path, expected) => {
    expect(parseSeoPath(path)).toEqual(expected);
  });
});

describe('언어 코드 변환', () => {
  it('URL 언어와 서버 언어를 상호 변환한다', () => {
    expect(toLanguage('ko')).toBe('KO');
    expect(toLanguage('en')).toBe('EN');
    expect(toUrlLang('KO')).toBe('ko');
    expect(toUrlLang('EN')).toBe('en');
  });
});
