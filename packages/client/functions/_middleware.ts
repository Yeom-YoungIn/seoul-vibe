/**
 * 목적 - Pages SPA 응답에 서버 SEO 조각을 주입한다.
 * 설명 - 정적 파일 폴백 이후 HTML 주석을 치환하고 실패한 조각도 제거한다.
 */
import { Env, fragmentForComment, loadFragment, shouldInject } from '../functions-lib/seo';

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next();
  if (!shouldInject(context.request, response)) return response;
  const path = new URL(context.request.url).pathname;
  const [head, body] = await Promise.all(
    (['head', 'body'] as const).map((kind) =>
      loadFragment(context.env.API_ORIGIN, path, kind, caches.default, (promise) =>
        context.waitUntil(promise)
      )
    )
  );
  const rewriter = new HTMLRewriter().onDocument({
    comments(comment) {
      const kind = fragmentForComment(comment.text);
      if (kind) comment.replace(kind === 'head' ? head : body, { html: true });
    },
  });
  // 변환된 경로별 HTML이 index.html의 ETag나 공유 캐시를 재사용하지 않게 한다.
  const html = new Response(response.body, response);
  html.headers.delete('content-length');
  html.headers.delete('etag');
  html.headers.set('Cache-Control', 'no-cache');
  return rewriter.transform(html);
};
