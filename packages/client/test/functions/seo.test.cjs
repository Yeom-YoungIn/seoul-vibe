/** 목적 - Pages SEO 장애 및 캐시 검증. 설명 - Node 기본 러너로 배포 코드의 계약을 확인한다. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  fragmentForComment,
  fragmentCacheKey,
  shouldInject,
  loadFragment,
  fetchWithTimeout,
  proxySeo,
} = require('../../../../tmp/pages-functions/functions-lib/seo.js');
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const noCache = { match: async () => undefined, put: async () => {} };

test('SSI 주석을 식별하고 다른 주석은 보존한다', () => {
  assert.equal(fragmentForComment('# include virtual="/__seo/head$seo_path" '), 'head');
  assert.equal(fragmentForComment(' # include virtual="/__seo/body/en" '), 'body');
  assert.equal(fragmentForComment('ordinary comment'), null);
});
test('캐시 키는 원래 경로와 API와 조각별로 구분된다', () => {
  assert.equal(
    fragmentCacheKey('https://api.test/', '/ko/articles/a', 'head'),
    'https://api.test/seo/head/ko/articles/a'
  );
  assert.notEqual(
    fragmentCacheKey('https://api.test', '/en', 'head'),
    fragmentCacheKey('https://api.test', '/en', 'body')
  );
  assert.notEqual(
    fragmentCacheKey('https://a.test', '/en', 'head'),
    fragmentCacheKey('https://b.test', '/en', 'head')
  );
  assert.equal(
    fragmentCacheKey('https://api.test', '//other.test', 'head'),
    'https://api.test/seo/head//other.test'
  );
});
test('GET HTML 확장자 없는 경로에만 주입한다', () => {
  const html = new Response('', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  assert.equal(shouldInject(new Request('https://pages.test/ko/articles/a?q=1'), html), true);
  for (const path of ['/assets/foo', '/index.html', '/sitemap.xml'])
    assert.equal(shouldInject(new Request(`https://pages.test${path}`), html), false);
  assert.equal(shouldInject(new Request('https://pages.test/en', { method: 'POST' }), html), false);
  assert.equal(shouldInject(new Request('https://pages.test/en'), new Response('')), false);
});
test('실패 및 비정상 HTTP 응답은 빈 문자열이고 캐시하지 않는다', async () => {
  for (const fetcher of [
    async () => {
      throw new Error('offline');
    },
    async () => new Response('error page', { status: 500 }),
  ]) {
    global.fetch = fetcher;
    let cached = false;
    assert.equal(
      await loadFragment(
        'https://api.test',
        '/en',
        'head',
        {
          ...noCache,
          put: async () => {
            cached = true;
          },
        },
        () => {}
      ),
      ''
    );
    assert.equal(cached, false);
  }
});
test('성공한 응답은 300초 캐시하고 캐시 적중 시 API를 호출하지 않는다', async () => {
  let stored;
  let key;
  const pending = [];
  global.fetch = async () => new Response('<title>Seoul</title>');
  assert.equal(
    await loadFragment(
      'https://api.test',
      '/en',
      'head',
      {
        ...noCache,
        put: async (k, r) => {
          key = k;
          stored = r;
        },
      },
      (p) => pending.push(p)
    ),
    '<title>Seoul</title>'
  );
  await Promise.all(pending);
  assert.equal(key, 'https://api.test/seo/head/en');
  assert.equal(stored.headers.get('Cache-Control'), 'public, max-age=300');
  global.fetch = async () => {
    throw new Error('must not fetch');
  };
  assert.equal(
    await loadFragment(
      'https://api.test',
      '/en',
      'head',
      { ...noCache, match: async () => stored },
      () => {}
    ),
    '<title>Seoul</title>'
  );
});
test('타임아웃과 본문 수신 지연도 빈 응답으로 종료한다', async () => {
  global.fetch = async () => new Promise(() => {});
  assert.equal(await fetchWithTimeout('https://api.test', 5), null);
  global.fetch = async () => new Response(new ReadableStream({ start() {} }));
  assert.equal(await fetchWithTimeout('https://api.test', 5), null);
});
test('sitemap과 robots는 원래 MIME을 유지하고 오류 페이지는 전달하지 않는다', async () => {
  for (const type of ['application/xml', 'text/plain']) {
    global.fetch = async () => new Response('ok', { headers: { 'Content-Type': type } });
    assert.equal(
      (await proxySeo('https://api.test', 'sitemap.xml')).headers.get('Content-Type'),
      type
    );
  }
  global.fetch = async () => new Response('error page', { status: 500 });
  const failed = await proxySeo('https://api.test', 'robots.txt');
  assert.equal(failed.status, 503);
  assert.equal(await failed.text(), '');
});
test('SPA 폴백 응답의 주석을 원래 경로로 치환하고 실패해도 제거한다', async () => {
  const { onRequest } = require('../../../../tmp/pages-functions/functions/_middleware.js');
  const originalRewriter = global.HTMLRewriter;
  const originalCaches = global.caches;
  global.caches = { default: noCache };
  global.HTMLRewriter = class {
    onDocument(handler) {
      this.handler = handler;
      return this;
    }
    async transform(response) {
      const html = (await response.text()).replace(/<!--([\s\S]*?)-->/g, (raw, text) => {
        let replaced = raw;
        this.handler.comments({
          text,
          replace(value) {
            replaced = value;
          },
        });
        return replaced;
      });
      return new Response(html, response);
    }
  };
  try {
    const paths = [];
    global.fetch = async (url) => {
      paths.push(url);
      return url.includes('/head')
        ? new Response('<title>Article</title>')
        : new Response('error', { status: 503 });
    };
    const result = await onRequest({
      request: new Request('https://pages.test/ko/articles/a?utm_source=x'),
      env: { API_ORIGIN: 'https://api.test' },
      waitUntil() {},
      next: async () =>
        new Response(
          '<head><!--# include virtual="/__seo/head$seo_path" --></head><body><!--# include virtual="/__seo/body$seo_path" --><!--keep--></body>',
          { headers: { 'Content-Type': 'text/html' } }
        ),
    });
    assert.equal(
      await result.text(),
      '<head><title>Article</title></head><body><!--keep--></body>'
    );
    assert.deepEqual(paths.sort(), [
      'https://api.test/seo/body/ko/articles/a',
      'https://api.test/seo/head/ko/articles/a',
    ]);
  } finally {
    global.HTMLRewriter = originalRewriter;
    global.caches = originalCaches;
  }
});

test('Workers가 지원하는 수동 리다이렉트를 사용하고 3xx는 거부한다', async () => {
  global.fetch = async (_url, init) => {
    assert.equal(init.redirect, 'manual');
    return new Response('redirect page', { status: 302 });
  };
  assert.equal(await fetchWithTimeout('https://api.test'), null);
});
