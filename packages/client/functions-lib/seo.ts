/**
 * 목적 - Pages SEO 치환 규칙과 장애 처리를 독립적으로 검증한다.
 * 설명 - 쿼리를 제외한 API별 조각 키를 사용하고 성공한 본문만 캐시한다.
 */
export interface Env {
  API_ORIGIN: string;
}
export type Fragment = 'head' | 'body';

export function fragmentForComment(text: string): Fragment | null {
  if (text.trimStart().startsWith('# include virtual="/__seo/head')) return 'head';
  if (text.trimStart().startsWith('# include virtual="/__seo/body')) return 'body';
  return null;
}

export function shouldInject(request: Request, response: Response): boolean {
  const path = new URL(request.url).pathname;
  return (
    request.method === 'GET' &&
    !path.startsWith('/assets/') &&
    !path.includes('.') &&
    (response.headers.get('content-type') ?? '').toLowerCase().startsWith('text/html')
  );
}

export function fragmentCacheKey(origin: string, pathname: string, kind: Fragment): string {
  // 원본 호스트 뒤에 경로를 붙여 // 경로가 API 호스트를 바꾸지 않도록 한다.
  return `${new URL(origin).origin}/seo/${kind}${pathname}`;
}

export async function fetchWithTimeout(url: string, timeoutMs = 2500): Promise<Response | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // 헤더뿐 아니라 전체 본문 수신까지 제한한다.
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal, redirect: 'manual' });
        if (!response.ok) return null;
        const body = await response.text();
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        return new Response(body, { status: response.status, headers });
      })(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(null);
        }, timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function loadFragment(
  origin: string,
  pathname: string,
  kind: Fragment,
  cache: Cache,
  waitUntil: (promise: Promise<unknown>) => void
): Promise<string> {
  try {
    const key = fragmentCacheKey(origin, pathname, kind);
    try {
      const hit = await cache.match(key);
      if (hit) return await hit.text();
    } catch {
      /* 캐시 장애는 원본 조회로 복구한다. */
    }
    const response = await fetchWithTimeout(key);
    if (!response) return '';
    const body = await response.text();
    const cached = new Response(body, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
    waitUntil(cache.put(key, cached).catch(() => undefined));
    return body;
  } catch {
    return '';
  }
}

export async function proxySeo(origin: string, path: string): Promise<Response> {
  try {
    const response = await fetchWithTimeout(`${new URL(origin).origin}/seo/${path}`);
    if (response) return response;
  } catch {
    /* 설정 누락도 외부 오류 본문 없이 처리한다. */
  }
  return new Response('', { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
