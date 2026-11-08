import {
  ArticleSeoData,
  renderArticleBody,
  renderArticleHead,
  renderArticleListBody,
  renderDefaultHead,
  renderRobots,
  renderSitemap,
  SeoConfig,
  summarize,
} from '../../src/seo/seo.render';

const cfg: SeoConfig = { siteUrl: 'https://sv.test', indexable: true };

const buildArticle = (overrides: Partial<ArticleSeoData> = {}): ArticleSeoData => ({
  slug: 'a',
  lang: 'ko',
  title: '제목',
  bodyHtml: '<p>성수동 카페 소개</p>',
  bodyText: null,
  publishedAt: new Date('2026-11-01T00:00:00Z'),
  updatedAt: new Date('2026-11-02T00:00:00Z'),
  availableLangs: ['en', 'ko'],
  sourceUrl: 'https://www.instagram.com/p/DcOEG9qkwW6/',
  sourceAuthor: '@seoul',
  sourceSiteName: 'Instagram',
  ...overrides,
});

const jsonLdOf = (html: string) => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('no json-ld');
  return { raw: match[1], data: JSON.parse(match[1]) };
};

describe('renderArticleHead', () => {
  it('제목, canonical, hreflang, og, JSON-LD를 렌더링한다', () => {
    const head = renderArticleHead(cfg, buildArticle());

    expect(head).toContain('<title>제목 | Seoul Vibe</title>');
    expect(head).toContain('<link rel="canonical" href="https://sv.test/ko/articles/a">');
    expect(head).toContain(
      '<link rel="alternate" hreflang="en" href="https://sv.test/en/articles/a">'
    );
    expect(head).toContain(
      '<link rel="alternate" hreflang="ko" href="https://sv.test/ko/articles/a">'
    );
    expect(head).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://sv.test/en/articles/a">'
    );
    expect(head).toContain('<meta property="og:image" content="https://sv.test/og-default.png">');
    expect(head).toContain('<meta property="og:type" content="article">');
    expect(head).toContain('<meta property="og:locale" content="ko_KR">');
    expect(head).toContain('<meta name="description" content="성수동 카페 소개">');
    expect(head).not.toContain('noindex');

    const { data } = jsonLdOf(head);
    expect(data['@type']).toBe('Article');
    expect(data.headline).toBe('제목');
    expect(data.inLanguage).toBe('ko');
    expect(data.isBasedOn).toBe('https://www.instagram.com/p/DcOEG9qkwW6/');
    expect(data.mainEntityOfPage).toBe('https://sv.test/ko/articles/a');
  });

  it('en 페이지는 og:locale이 en_US다', () => {
    expect(renderArticleHead(cfg, buildArticle({ lang: 'en' }))).toContain(
      '<meta property="og:locale" content="en_US">'
    );
  });

  it('한 언어만 있으면 그 언어만 hreflang에 넣고 x-default도 그 언어다', () => {
    const head = renderArticleHead(cfg, buildArticle({ availableLangs: ['ko'] }));

    expect(head).not.toContain('hreflang="en"');
    expect(head).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://sv.test/ko/articles/a">'
    );
  });

  it('출처가 없으면 isBasedOn을 넣지 않는다', () => {
    const { data } = jsonLdOf(renderArticleHead(cfg, buildArticle({ sourceUrl: null })));
    expect('isBasedOn' in data).toBe(false);
  });

  it('제목의 HTML을 이스케이프하고 JSON-LD 안의 </script>를 무력화한다', () => {
    const head = renderArticleHead(cfg, buildArticle({ title: '"><script>alert(1)</script>' }));

    expect(head).not.toContain('<script>alert');
    const { raw, data } = jsonLdOf(head);
    expect(raw).not.toContain('</script>');
    expect(data.headline).toBe('"><script>alert(1)</script>');
  });

  it('indexable이 false면 noindex를 넣는다', () => {
    const head = renderArticleHead({ ...cfg, indexable: false }, buildArticle());
    expect(head).toContain('<meta name="robots" content="noindex, nofollow">');
  });
});

describe('renderDefaultHead', () => {
  it('홈은 언어별 문구와 canonical, hreflang을 렌더링한다', () => {
    const head = renderDefaultHead(cfg, { kind: 'home', lang: 'ko' });

    expect(head).toContain('<title>Seoul Vibe — 서울 로컬 장소 가이드</title>');
    expect(head).toContain('<link rel="canonical" href="https://sv.test/ko">');
    expect(head).toContain('<link rel="alternate" hreflang="en" href="https://sv.test/en">');
    expect(head).toContain('<link rel="alternate" hreflang="x-default" href="https://sv.test/en">');
  });

  it('목록은 Guides 접두어를 붙인다', () => {
    const head = renderDefaultHead(cfg, { kind: 'articles', lang: 'en' });
    expect(head).toContain('<title>Guides | Seoul Vibe — Local places in Seoul</title>');
    expect(head).toContain('<link rel="canonical" href="https://sv.test/en/articles">');
  });

  it('그 외 경로는 canonical 없이 기본 메타만 렌더링한다', () => {
    const head = renderDefaultHead(cfg, { kind: 'other' });
    expect(head).toContain('<title>Seoul Vibe — Local places in Seoul</title>');
    expect(head).not.toContain('canonical');
  });

  it('noindex 옵션을 지원한다', () => {
    expect(renderDefaultHead(cfg, { kind: 'other' }, { noindex: true })).toContain(
      '<meta name="robots" content="noindex, nofollow">'
    );
  });
});

describe('renderArticleBody', () => {
  it('bodyHtml의 위험한 태그와 속성을 제거한다', () => {
    const body = renderArticleBody(
      buildArticle({ bodyHtml: '<p>hi</p><script>x()</script><img src="x.jpg" onerror="y()">' })
    );

    expect(body).toContain('<p>hi</p>');
    expect(body).not.toContain('<script');
    expect(body).not.toContain('onerror');
    expect(body).toContain('<h1>제목</h1>');
  });

  it('bodyHtml이 없으면 bodyText를 문단으로 렌더링한다', () => {
    const body = renderArticleBody(buildArticle({ bodyHtml: null, bodyText: 'a\nb' }));
    expect(body).toContain('<p>a</p><p>b</p>');
  });

  it('출처가 있으면 원문 링크를 넣는다', () => {
    const body = renderArticleBody(buildArticle());
    expect(body).toContain('href="https://www.instagram.com/p/DcOEG9qkwW6/"');
    expect(body).toContain('rel="noopener"');
  });
});

describe('renderArticleListBody', () => {
  it('언어 접두어가 붙은 아티클 링크 목록을 렌더링한다', () => {
    const body = renderArticleListBody('ko', [{ slug: 'a', title: '<b>제목</b>' }]);
    expect(body).toContain('<a href="/ko/articles/a">&lt;b&gt;제목&lt;/b&gt;</a>');
  });
});

describe('summarize', () => {
  it('태그와 연속 공백을 제거한다', () => {
    expect(summarize('<p>a  <b>b</b></p>\n<p>c</p>', null)).toBe('a b c');
  });

  it('문단 사이에 공백을 두고 엔티티를 디코딩한다', () => {
    expect(summarize('<p>A &amp; B</p><p>C</p>', null)).toBe('A & B C');
  });

  it('155자를 넘으면 잘라서 …를 붙인다', () => {
    const result = summarize(null, 'ㄱ'.repeat(200));
    expect(result.length).toBeLessThanOrEqual(156);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('renderRobots', () => {
  it('indexable이면 비공개 경로만 막고 sitemap을 알린다', () => {
    const robots = renderRobots(cfg);
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /auth');
    expect(robots).toContain('Disallow: /api');
    expect(robots).toContain('Sitemap: https://sv.test/sitemap.xml');
  });

  it('indexable이 아니면 전체를 막는다', () => {
    const robots = renderRobots({ ...cfg, indexable: false });
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Sitemap:');
    expect(robots).not.toContain('Allow:');
  });
});

describe('renderSitemap', () => {
  const entries = [
    {
      path: '/ko/articles/a',
      alternates: { en: '/en/articles/a', ko: '/ko/articles/a' },
      lastmod: new Date('2026-11-02T00:00:00Z'),
    },
  ];

  it('alternates와 lastmod를 포함한다', () => {
    const xml = renderSitemap(cfg, entries);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://sv.test/ko/articles/a</loc>');
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://sv.test/en/articles/a"/>'
    );
    expect(xml).toContain('<lastmod>2026-11-02</lastmod>');
  });

  it('indexable이 아니면 url이 없다', () => {
    expect(renderSitemap({ ...cfg, indexable: false }, entries)).not.toContain('<url>');
  });
});
